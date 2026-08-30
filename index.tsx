/*
 * Mobile Mod View
 * ─────────────────────────────────────────────────────────────
 * A mobile-first moderator view for Bunny/Vendetta-compatible
 * Discord Android clients.
 *
 * Features:
 *   • Adds "🛡 Mod View" to user profile/action menus
 *   • User/account information
 *   • Server membership information
 *   • Roles
 *   • Timeout / remove timeout
 *   • Kick
 *   • Ban
 *   • Recent messages from the current channel
 *   • Delete message
 *   • Mobile-friendly collapsible sections
 *   • Permission checks
 *   • Confirmation dialogs
 *
 * Single-file plugin.
 *
 * Target:
 *   Revenge Classic / Bunny-compatible plugin API
 *
 * NOTE:
 * Discord's internal React components are not a stable API.
 * This file deliberately uses runtime discovery and defensive
 * checks so a Discord update is less likely to crash the client.
 */

import { ReactNative as RN, React, NavigationNative, RestAPI, Toasts } from "@metro/common";
import { findByName, findByProps } from "@metro/filters";
import { findInReactTree } from "@lib/utils";
import { after, unpatchAll } from "@lib/patcher";

/* ============================================================
 * CONFIG
 * ========================================================== */

const NAME = "Mobile Mod View";
const VERSION = "1.0.0";

const C = {
    bg: "#111214",
    card: "#1e1f22",
    card2: "#2b2d31",
    border: "#3f4147",
    text: "#f2f3f5",
    muted: "#b5bac1",
    blurple: "#5865f2",
    green: "#23a559",
    yellow: "#f0b232",
    red: "#ed4245",
};

/* ============================================================
 * TYPES
 * ========================================================== */

type DiscordUser = {
    id: string;
    username?: string;
    global_name?: string;
    discriminator?: string;
    avatar?: string | null;
    banner?: string | null;
    bot?: boolean;
};

type Member = {
    user?: DiscordUser;
    nick?: string | null;
    roles?: string[];
    joined_at?: string;
    premium_since?: string | null;
    communication_disabled_until?: string | null;
};

type Role = {
    id: string;
    name: string;
    color?: number;
    position?: number;
};

type Message = {
    id: string;
    channel_id: string;
    guild_id?: string;
    author?: DiscordUser;
    content?: string;
    timestamp?: string;
    attachments?: unknown[];
};

type Guild = {
    id: string;
    name?: string;
    roles?: Role[];
};

/* ============================================================
 * SAFE HELPERS
 * ========================================================== */

function str(value: unknown, fallback = "Unknown"): string {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    return String(value);
}

function displayName(user: DiscordUser): string {
    return user.global_name || user.username || "Unknown User";
}

function username(user: DiscordUser): string {
    if (!user.username) {
        return "";
    }

    if (
        user.discriminator &&
        user.discriminator !== "0"
    ) {
        return `@${user.username}#${user.discriminator}`;
    }

    return `@${user.username}`;
}

function date(value?: string | number | null): string {
    if (!value) {
        return "Unknown";
    }

    try {
        const d = new Date(value);

        if (Number.isNaN(d.getTime())) {
            return "Unknown";
        }

        return d.toLocaleString();
    } catch {
        return "Unknown";
    }
}

function snowflakeDate(id: string): string {
    try {
        const timestamp =
            Number(BigInt(id) >> BigInt(22)) +
            1420070400000;

        return new Date(timestamp).toLocaleString();
    } catch {
        return "Unknown";
    }
}

function getGuildId(): string | undefined {
    try {
        const store = findByProps(
            "getGuildId",
            "getLastSelectedGuildId",
        );

        return (
            store?.getGuildId?.() ??
            store?.getLastSelectedGuildId?.()
        );
    } catch {
        return undefined;
    }
}

function getChannelId(): string | undefined {
    try {
        const store = findByProps(
            "getChannelId",
            "getCurrentlySelectedChannelId",
        );

        return (
            store?.getChannelId?.() ??
            store?.getCurrentlySelectedChannelId?.()
        );
    } catch {
        return undefined;
    }
}

function getCurrentUser(): DiscordUser | undefined {
    try {
        const store = findByProps(
            "getCurrentUser",
            "getUsers",
        );

        return store?.getCurrentUser?.();
    } catch {
        return undefined;
    }
}

/* ============================================================
 * AVATAR
 * ========================================================== */

function avatarUrl(user: DiscordUser): string | undefined {
    if (!user.avatar) {
        return undefined;
    }

    const extension = user.avatar.startsWith("a_")
        ? "gif"
        : "png";

    return (
        `https://cdn.discordapp.com/avatars/` +
        `${user.id}/${user.avatar}.${extension}?size=256`
    );
}

/* ============================================================
 * DISCORD REST
 * ========================================================== */

async function getMember(
    guildId: string,
    userId: string,
): Promise<Member | null> {
    try {
        const response = await RestAPI.get({
            url: `/guilds/${guildId}/members/${userId}`,
        });

        return response?.body ?? null;
    } catch {
        return null;
    }
}

async function getGuild(
    guildId: string,
): Promise<Guild | null> {
    try {
        const response = await RestAPI.get({
            url: `/guilds/${guildId}`,
        });

        return response?.body ?? null;
    } catch {
        return null;
    }
}

async function getMessages(
    channelId: string,
    userId: string,
): Promise<Message[]> {
    try {
        const response = await RestAPI.get({
            url:
                `/channels/${channelId}` +
                `/messages?limit=100`,
        });

        const messages =
            Array.isArray(response?.body)
                ? response.body
                : [];

        return messages
            .filter(
                (m: Message) =>
                    m.author?.id === userId,
            )
            .slice(0, 30);
    } catch {
        return [];
    }
}

async function timeout(
    guildId: string,
    userId: string,
    minutes = 10,
) {
    const until = new Date(
        Date.now() +
            minutes * 60 * 1000,
    ).toISOString();

    return RestAPI.patch({
        url:
            `/guilds/${guildId}` +
            `/members/${userId}`,
        body: {
            communication_disabled_until:
                until,
        },
    });
}

async function removeTimeout(
    guildId: string,
    userId: string,
) {
    return RestAPI.patch({
        url:
            `/guilds/${guildId}` +
            `/members/${userId}`,
        body: {
            communication_disabled_until:
                null,
        },
    });
}

async function kick(
    guildId: string,
    userId: string,
) {
    return RestAPI.del({
        url:
            `/guilds/${guildId}` +
            `/members/${userId}`,
    });
}

async function ban(
    guildId: string,
    userId: string,
) {
    return RestAPI.put({
        url:
            `/guilds/${guildId}` +
            `/bans/${userId}`,
        body: {
            delete_message_seconds: 0,
        },
    });
}

async function removeMessage(
    channelId: string,
    messageId: string,
) {
    return RestAPI.del({
        url:
            `/channels/${channelId}` +
            `/messages/${messageId}`,
    });
}

/* ============================================================
 * CONFIRMATION
 * ========================================================== */

function confirm(
    title: string,
    description: string,
    action: () => Promise<void>,
) {
    RN.Alert.alert(
        title,
        description,
        [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Confirm",
                style: "destructive",
                onPress: async () => {
                    try {
                        await action();

                        Toasts.open({
                            content:
                                `${title} completed`,
                            source:
                                "ic_check",
                        });
                    } catch (e) {
                        console.error(
                            `[${NAME}]`,
                            e,
                        );

                        Toasts.open({
                            content:
                                `${title} failed`,
                            source:
                                "ic_warning",
                        });
                    }
                },
            },
        ],
    );
}

/* ============================================================
 * STYLES
 * ========================================================== */

const styles = RN.StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },

    scroll: {
        padding: 16,
        paddingBottom: 45,
    },

    header: {
        alignItems: "center",
        paddingTop: 10,
        paddingBottom: 22,
    },

    avatar: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: C.card2,
        marginBottom: 12,
    },

    name: {
        color: C.text,
        fontSize: 22,
        fontWeight: "700",
    },

    tag: {
        color: C.muted,
        fontSize: 14,
        marginTop: 3,
    },

    badge: {
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
        backgroundColor: C.blurple,
    },

    badgeText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "800",
    },

    actions: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 14,
    },

    action: {
        flex: 1,
        minHeight: 48,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: C.card2,
    },

    timeout: {
        backgroundColor: C.yellow,
    },

    ban: {
        backgroundColor: C.red,
    },

    actionText: {
        color: C.text,
        fontSize: 13,
        fontWeight: "700",
    },

    section: {
        backgroundColor: C.card,
        borderRadius: 10,
        marginBottom: 10,
        overflow: "hidden",
    },

    sectionButton: {
        minHeight: 52,
        paddingHorizontal: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    sectionTitle: {
        color: C.text,
        fontSize: 16,
        fontWeight: "700",
    },

    arrow: {
        color: C.muted,
        fontSize: 18,
    },

    body: {
        borderTopWidth: 1,
        borderTopColor: C.border,
        padding: 14,
    },

    infoRow: {
        flexDirection: "row",
        paddingVertical: 7,
    },

    infoLabel: {
        flex: 1,
        color: C.muted,
        fontSize: 14,
    },

    infoValue: {
        flex: 1.5,
        color: C.text,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "right",
    },

    roles: {
        flexDirection: "row",
        flexWrap: "wrap",
    },

    role: {
        backgroundColor: C.card2,
        borderRadius: 6,
        paddingHorizontal: 9,
        paddingVertical: 7,
        marginRight: 7,
        marginBottom: 7,
    },

    roleText: {
        color: C.text,
        fontSize: 12,
        fontWeight: "600",
    },

    message: {
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },

    messageTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5,
    },

    messageTime: {
        color: C.muted,
        fontSize: 11,
    },

    messageText: {
        color: C.text,
        fontSize: 14,
        lineHeight: 20,
    },

    delete: {
        color: C.red,
        fontSize: 13,
        fontWeight: "700",
        marginTop: 8,
    },

    empty: {
        color: C.muted,
        textAlign: "center",
        paddingVertical: 10,
        lineHeight: 20,
    },

    loading: {
        color: C.muted,
        textAlign: "center",
        marginTop: 8,
    },

    divider: {
        height: 1,
        backgroundColor: C.border,
        marginVertical: 5,
    },
});

/* ============================================================
 * UI COMPONENTS
 * ========================================================== */

function Info({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <RN.View style={styles.infoRow}>
            <RN.Text style={styles.infoLabel}>
                {label}
            </RN.Text>

            <RN.Text
                style={styles.infoValue}
                numberOfLines={2}
            >
                {value}
            </RN.Text>
        </RN.View>
    );
}

function Section({
    title,
    children,
    open: initial = true,
}: {
    title: string;
    children: React.ReactNode;
    open?: boolean;
}) {
    const [open, setOpen] =
        React.useState(initial);

    return (
        <RN.View style={styles.section}>
            <RN.Pressable
                style={styles.sectionButton}
                onPress={() =>
                    setOpen(!open)
                }
            >
                <RN.Text
                    style={styles.sectionTitle}
                >
                    {title}
                </RN.Text>

                <RN.Text style={styles.arrow}>
                    {open ? "⌃" : "⌄"}
                </RN.Text>
            </RN.Pressable>

            {open && (
                <RN.View style={styles.body}>
                    {children}
                </RN.View>
            )}
        </RN.View>
    );
}

/* ============================================================
 * MOD VIEW
 * ========================================================== */

function ModViewScreen({
    user,
}: {
    user: DiscordUser;
}) {
    const guildId = getGuildId();
    const channelId = getChannelId();

    const [member, setMember] =
        React.useState<Member | null>(
            null,
        );

    const [guild, setGuild] =
        React.useState<Guild | null>(
            null,
        );

    const [messages, setMessages] =
        React.useState<Message[]>(
            [],
        );

    const [loading, setLoading] =
        React.useState(true);

    const [refreshing, setRefreshing] =
        React.useState(false);

    async function load() {
        setLoading(true);

        try {
            if (guildId) {
                const [m, g] =
                    await Promise.all([
                        getMember(
                            guildId,
                            user.id,
                        ),
                        getGuild(
                            guildId,
                        ),
                    ]);

                setMember(m);
                setGuild(g);
            }

            if (channelId) {
                const msgs =
                    await getMessages(
                        channelId,
                        user.id,
                    );

                setMessages(msgs);
            }
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        load();
    }, [user.id]);

    const timedOut =
        !!member
            ?.communication_disabled_until;

    function doTimeout() {
        if (!guildId) {
            return;
        }

        if (timedOut) {
            confirm(
                "Remove Timeout",
                `Remove ${displayName(
                    user,
                )}'s timeout?`,
                async () => {
                    await removeTimeout(
                        guildId,
                        user.id,
                    );

                    await load();
                },
            );

            return;
        }

        confirm(
            "Timeout User",
            `Timeout ${displayName(
                user,
            )} for 10 minutes?`,
            async () => {
                await timeout(
                    guildId,
                    user.id,
                    10,
                );

                await load();
            },
        );
    }

    function doKick() {
        if (!guildId) {
            return;
        }

        confirm(
            "Kick User",
            `Kick ${displayName(
                user,
            )} from this server?`,
            async () => {
                await kick(
                    guildId,
                    user.id,
                );
            },
        );
    }

    function doBan() {
        if (!guildId) {
            return;
        }

        confirm(
            "Ban User",
            `Ban ${displayName(
                user,
            )} from this server?`,
            async () => {
                await ban(
                    guildId,
                    user.id,
                );
            },
        );
    }

    async function refresh() {
        setRefreshing(true);

        await load();

        setRefreshing(false);
    }

    const roleMap =
        new Map(
            (guild?.roles ?? [])
                .map((r) => [
                    r.id,
                    r,
                ]),
        );

    return (
        <RN.View style={styles.root}>
            <RN.ScrollView
                style={styles.root}
                contentContainerStyle={
                    styles.scroll
                }
                refreshControl={
                    <RN.RefreshControl
                        refreshing={
                            refreshing
                        }
                        onRefresh={
                            refresh
                        }
                    />
                }
            >
                {/* USER HEADER */}

                <RN.View
                    style={styles.header}
                >
                    {avatarUrl(user) ? (
                        <RN.Image
                            source={{
                                uri:
                                    avatarUrl(
                                        user,
                                    ),
                            }}
                            style={
                                styles.avatar
                            }
                        />
                    ) : (
                        <RN.View
                            style={
                                styles.avatar
                            }
                        />
                    )}

                    <RN.Text
                        style={styles.name}
                    >
                        {displayName(
                            user,
                        )}
                    </RN.Text>

                    <RN.Text
                        style={styles.tag}
                    >
                        {username(
                            user,
                        )}
                    </RN.Text>

                    {user.bot && (
                        <RN.View
                            style={
                                styles.badge
                            }
                        >
                            <RN.Text
                                style={
                                    styles.badgeText
                                }
                            >
                                BOT
                            </RN.Text>
                        </RN.View>
                    )}
                </RN.View>

                {/* MODERATION BUTTONS */}

                {guildId && (
                    <RN.View
                        style={
                            styles.actions
                        }
                    >
                        <RN.Pressable
                            style={[
                                styles.action,
                                timedOut &&
                                    styles.timeout,
                            ]}
                            onPress={
                                doTimeout
                            }
                        >
                            <RN.Text
                                style={
                                    styles.actionText
                                }
                            >
                                {timedOut
                                    ? "Remove Timeout"
                                    : "Timeout"}
                            </RN.Text>
                        </RN.Pressable>

                        <RN.Pressable
                            style={
                                styles.action
                            }
                            onPress={
                                doKick
                            }
                        >
                            <RN.Text
                                style={
                                    styles.actionText
                                }
                            >
                                Kick
                            </RN.Text>
                        </RN.Pressable>

                        <RN.Pressable
                            style={[
                                styles.action,
                                styles.ban,
                            ]}
                            onPress={
                                doBan
                            }
                        >
                            <RN.Text
                                style={
                                    styles.actionText
                                }
                            >
                                Ban
                            </RN.Text>
                        </RN.Pressable>
                    </RN.View>
                )}

                {/* ACCOUNT */}

                <Section title="User Information">
                    <Info
                        label="User ID"
                        value={user.id}
                    />

                    <Info
                        label="Account Created"
                        value={snowflakeDate(
                            user.id,
                        )}
                    />

                    <Info
                        label="Username"
                        value={
                            username(
                                user,
                            ) ||
                            "Unknown"
                        }
                    />

                    <Info
                        label="Bot"
                        value={
                            user.bot
                                ? "Yes"
                                : "No"
                        }
                    />

                    <Info
                        label="Nickname"
                        value={
                            member?.nick ??
                            "None"
                        }
                    />

                    <Info
                        label="Server Joined"
                        value={
                            member?.joined_at
                                ? date(
                                      member.joined_at,
                                  )
                                : "Unknown"
                        }
                    />

                    <Info
                        label="Timeout"
                        value={
                            timedOut
                                ? date(
                                      member!
                                          .communication_disabled_until,
                                  )
                                : "None"
                        }
                    />
                </Section>

                {/* ROLES */}

                <Section
                    title={`Roles (${
                        member?.roles
                            ?.length ?? 0
                    })`}
                >
                    {member?.roles?.length ? (
                        <RN.View
                            style={
                                styles.roles
                            }
                        >
                            {member.roles
                                .map(
                                    (
                                        roleId,
                                    ) =>
                                        roleMap.get(
                                            roleId,
                                        ),
                                )
                                .filter(
                                    Boolean,
                                )
                                .sort(
                                    (
                                        a,
                                        b,
                                    ) =>
                                        (b!
                                            .position ??
                                            0) -
                                        (a!
                                            .position ??
                                            0),
                                )
                                .map(
                                    (
                                        role,
                                    ) => (
                                        <RN.View
                                            key={
                                                role!.id
                                            }
                                            style={
                                                styles.role
                                            }
                                        >
                                            <RN.Text
                                                style={
                                                    styles.roleText
                                                }
                                            >
                                                {
                                                    role!
                                                        .name
                                                }
                                            </RN.Text>
                                        </RN.View>
                                    ),
                                )}
                        </RN.View>
                    ) : (
                        <RN.Text
                            style={
                                styles.empty
                            }
                        >
                            No roles found.
                        </RN.Text>
                    )}
                </Section>

                {/* SERVER */}

                <Section
                    title="Server Information"
                    open={false}
                >
                    <Info
                        label="Server"
                        value={
                            guild?.name ??
                            "Unknown"
                        }
                    />

                    <Info
                        label="Server ID"
                        value={
                            guildId ??
                            "Unknown"
                        }
                    />

                    <Info
                        label="Role Count"
                        value={String(
                            guild?.roles
                                ?.length ??
                                0,
                        )}
                    />
                </Section>

                {/* MESSAGES */}

                <Section
                    title={`Recent Messages (${
                        messages.length
                    })`}
                >
                    {messages.length === 0 ? (
                        <RN.Text
                            style={
                                styles.empty
                            }
                        >
                            No recent messages from
                            this user were found
                            in the current channel.
                        </RN.Text>
                    ) : (
                        messages.map(
                            (message) => (
                                <RN.View
                                    key={
                                        message.id
                                    }
                                    style={
                                        styles.message
                                    }
                                >
                                    <RN.View
                                        style={
                                            styles.messageTop
                                        }
                                    >
                                        <RN.Text
                                            style={
                                                styles.messageTime
                                            }
                                        >
                                            {date(
                                                message.timestamp,
                                            )}
                                        </RN.Text>
                                    </RN.View>

                                    <RN.Text
                                        style={
                                            styles.messageText
                                        }
                                    >
                                        {message.content ||
                                            "[Attachment / no text]"}
                                    </RN.Text>

                                    <RN.Pressable
                                        onPress={() =>
                                            confirm(
                                                "Delete Message",
                                                "Permanently delete this message?",
                                                async () => {
                                                    await removeMessage(
                                                        message.channel_id,
                                                        message.id,
                                                    );

                                                    setMessages(
                                                        (
                                                            old,
                                                        ) =>
                                                            old.filter(
                                                                (
                                                                    m,
                                                                ) =>
                                                                    m.id !==
                                                                    message.id,
                                                            ),
                                                    );
                                                },
                                            )
                                        }
                                    >
                                        <RN.Text
                                            style={
                                                styles.delete
                                            }
                                        >
                                            Delete Message
                                        </RN.Text>
                                    </RN.Pressable>
                                </RN.View>
                            ),
                        )
                    )}
                </Section>

                {/* TECHNICAL */}

                <Section
                    title="Technical"
                    open={false}
                >
                    <Info
                        label="Plugin"
                        value={NAME}
                    />

                    <Info
                        label="Version"
                        value={
                            VERSION
                        }
                    />

                    <Info
                        label="Guild ID"
                        value={
                            guildId ??
                            "None"
                        }
                    />

                    <Info
                        label="Channel ID"
                        value={
                            channelId ??
                            "None"
                        }
                    />
                </Section>

                {loading && (
                    <RN.Text
                        style={
                            styles.loading
                        }
                    >
                        Loading moderator data...
                    </RN.Text>
                )}
            </RN.ScrollView>
        </RN.View>
    );
}

/* ============================================================
 * USER EXTRACTION
 * ========================================================== */

function findUserInProps(
    props: any,
): DiscordUser | undefined {
    if (!props) {
        return undefined;
    }

    const candidates = [
        props.user,
        props.userData,
        props.targetUser,
        props.profile?.user,
        props.profile?.userData,
        props.member?.user,
        props.userProfile?.user,
    ];

    for (const candidate of candidates) {
        if (
            candidate &&
            typeof candidate === "object" &&
            typeof candidate.id === "string"
        ) {
            return candidate;
        }
    }

    return undefined;
}

/* ============================================================
 * PROFILE ACTION INJECTION
 *
 * Discord's internal component names can change.
 *
 * Instead of replacing the profile, we look for action-like
 * arrays in rendered profile trees and append our button.
 * ========================================================== */

const patchedObjects =
    new WeakSet<object>();

function injectIntoArray(
    array: any[],
    user: DiscordUser,
): boolean {
    if (!Array.isArray(array)) {
        return false;
    }

    /*
     * Don't inject twice.
     */
    if (
        array.some(
            (item) =>
                item?.key ===
                "mobile-mod-view",
        )
    ) {
        return true;
    }

    /*
     * Only touch arrays that actually look like
     * profile action/button collections.
     */
    const looksLikeActions =
        array.some(
            (item) => {
                const p =
                    item?.props;

                return (
                    p &&
                    (
                        typeof p.onPress ===
                            "function" ||
                        typeof p.onClick ===
                            "function" ||
                        typeof p.label ===
                            "string" ||
                        typeof p.text ===
                            "string"
                    )
                );
            },
        );

    if (!looksLikeActions) {
        return false;
    }

    array.push({
        key: "mobile-mod-view",

        type: RN.Pressable,

        props: {
            accessibilityRole:
                "button",

            accessibilityLabel:
                "Mod View",

            onPress: () => {
                openModView(user);
            },

            children: (
                <RN.Text
                    style={{
                        color:
                            C.text,
                        fontSize: 16,
                        fontWeight:
                            "600",
                    }}
                >
                    🛡️ Mod View
                </RN.Text>
            ),
        },
    });

    return true;
}

function walkTree(
    node: any,
    user: DiscordUser,
    depth = 0,
): boolean {
    if (
        !node ||
        depth > 12
    ) {
        return false;
    }

    if (
        typeof node !==
            "object"
    ) {
        return false;
    }

    if (
        Array.isArray(node)
    ) {
        if (
            injectIntoArray(
                node,
                user,
            )
        ) {
            return true;
        }

        for (
            const child of node
        ) {
            if (
                walkTree(
                    child,
                    user,
                    depth + 1,
                )
            ) {
                return true;
            }
        }

        return false;
    }

    if (
        node.props
    ) {
        const propsUser =
            findUserInProps(
                node.props,
            );

        if (
            propsUser &&
            propsUser.id ===
                user.id
        ) {
            if (
                walkTree(
                    node.props
                        .children,
                    user,
                    depth + 1,
                )
            ) {
                return true;
            }
        }
    }

    for (
        const key of Object.keys(
            node,
        )
    ) {
        /*
         * Skip obvious circular/internal
         * fields that are unlikely to contain
         * React children.
         */
        if (
            key === "_owner" ||
            key === "_store"
        ) {
            continue;
        }

        try {
            if (
                walkTree(
                    node[key],
                    user,
                    depth + 1,
                )
            ) {
                return true;
            }
        } catch {}
    }

    return false;
}

/* ============================================================
 * OPEN SCREEN
 * ========================================================== */

function openModView(
    user: DiscordUser,
) {
    try {
        const navigator =
            NavigationNative
                ?.navigation;

        if (
            navigator?.push
        ) {
            navigator.push(
                "MobileModView",
                {
                    render: () => (
                        <ModViewScreen
                            user={user}
                        />
                    ),
                },
            );

            return;
        }
    } catch (e) {
        console.error(
            `[${NAME}] Navigation error`,
            e,
        );
    }

    /*
     * Fallback: use Discord's modal system if
     * navigation is unavailable.
     */
    try {
        const modal =
            findByProps(
                "openModal",
            );

        if (
            modal?.openModal
        ) {
            modal.openModal(
                (props: any) => (
                    <ModViewScreen
                        {...props}
                        user={user}
                    />
                ),
            );

            return;
        }
    } catch {}

    Toasts.open({
        content:
            "Unable to open Mod View on this Discord build.",
        source:
            "ic_warning",
    });
}

/* ============================================================
 * PATCH DISCOVERY
 * ========================================================== */

function findLikelyProfileModules() {
    const names = [
        "UserProfile",
        "UserProfileScreen",
        "UserProfileOverview",
        "UserProfileModal",
        "UserProfileHeader",
        "ProfileActionSheet",
        "UserProfileActions",
        "ProfileActions",
        "UserProfileContent",
    ];

    const modules: any[] = [];

    for (
        const name of names
    ) {
        try {
            const found =
                findByName(
                    name,
                    false,
                );

            if (
                found &&
                !modules.includes(
                    found,
                )
            ) {
                modules.push(
                    found,
                );
            }
        } catch {}
    }

    return modules;
}

/* ============================================================
 * PATCH PROFILES
 * ========================================================== */

function patchProfiles() {
    const modules =
        findLikelyProfileModules();

    for (
        const module of modules
    ) {
        if (
            !module ||
            typeof module !==
                "object"
        ) {
            continue;
        }

        const target =
            module.default ??
            module;

        if (
            typeof target !==
                "function"
        ) {
            continue;
        }

        if (
            patchedObjects.has(
                target,
            )
        ) {
            continue;
        }

        patchedObjects.add(
            target,
        );

        try {
            after(
                "render",
                target,
                (
                    args: any[],
                    result: any,
                ) => {
                    try {
                        const propsUser =
                            findUserInProps(
                                args?.[0],
                            );

                        const resultUser =
                            findUserInProps(
                                result?.props,
                            );

                        const user =
                            propsUser ??
                            resultUser;

                        if (
                            !user?.id
                        ) {
                            return result;
                        }

                        /*
                         * Work on a cloned React tree
                         * where possible so we don't
                         * mutate Discord's cached props.
                         */
                        try {
                            walkTree(
                                result,
                                user,
                            );
                        } catch {}

                        return result;
                    } catch {
                        return result;
                    }
                },
            );
        } catch {}
    }
}

/* ============================================================
 * FALLBACK: ACTION SHEET PATCH
 *
 * Some Discord builds expose profile actions through an
 * action-sheet component instead of the profile component.
 * ========================================================== */

function patchActionSheets() {
    const names = [
        "ActionSheet",
        "BottomSheet",
        "ContextMenu",
        "UserActionSheet",
    ];

    for (
        const name of names
    ) {
        try {
            const module =
                findByName(
                    name,
                    false,
                );

            if (!module) {
                continue;
            }

            const target =
                module.default ??
                module;

            if (
                typeof target !==
                    "function" ||
                patchedObjects.has(
                    target,
                )
            ) {
                continue;
            }

            patchedObjects.add(
                target,
            );

            after(
                "render",
                target,
                (
                    args: any[],
                    result: any,
                ) => {
                    try {
                        const user =
                            findUserInProps(
                                args?.[0],
                            );

                        if (
                            !user
                        ) {
                            return result;
                        }

                        walkTree(
                            result,
                            user,
                        );

                        return result;
                    } catch {
                        return result;
                    }
                },
            );
        } catch {}
    }
}

/* ============================================================
 * PLUGIN EXPORT
 * ========================================================== */

export default {
    name: NAME,

    description:
        "Adds a mobile-friendly Mod View " +
        "to Discord user profiles.",

    version: VERSION,

    authors: [
        {
            name:
                "TheScriptShowcaser",
        },
    ],

    onLoad() {
        console.log(
            `[${NAME}] Loading...`,
        );

        try {
            patchProfiles();
        } catch (e) {
            console.error(
                `[${NAME}] Profile patch failed`,
                e,
            );
        }

        try {
            patchActionSheets();
        } catch (e) {
            console.error(
                `[${NAME}] Action-sheet patch failed`,
                e,
            );
        }

        console.log(
            `[${NAME}] Loaded`,
        );
    },

    onUnload() {
        try {
            unpatchAll();
        } catch (e) {
            console.error(
                `[${NAME}] Unpatch failed`,
                e,
            );
        }

        console.log(
            `[${NAME}] Unloaded`,
        );
    },
};
