/*
 * Mobile Mod View
 * Bunny / Vendetta-compatible plugin
 *
 * Files:
 *   manifest.json
 *   index.js
 *
 * Adds:
 *   • Mod View entry to user action/profile menus
 *   • Account information
 *   • Server membership information
 *   • Roles
 *   • Timeout status
 *   • Timeout / remove timeout
 *   • Kick
 *   • Ban
 *   • Recent messages
 *   • Delete message
 *
 * IMPORTANT:
 * Discord's internal React components change between versions.
 * The profile/action-sheet discovery below is intentionally
 * defensive.
 */

/* ---------------------------------------------------------
 * Bunny / Vendetta APIs
 * ------------------------------------------------------- */

const {
    React,
    ReactNative,
    NavigationNative,
    stylesheet,
    lodash,
} = window.vendetta?.common || {};

const {
    findByName,
    findByProps,
    findByStoreName,
} = window.vendetta?.metro?.common || {};

const {
    after,
    before,
    instead,
    unpatchAll,
} = window.vendetta?.patcher || {};

const {
    getAssetIDByName,
} = window.vendetta?.assets || {};

const {
    openModal,
} = window.vendetta?.navigation || {};

const {
    showToast,
} = window.vendetta?.toasts || {};

const {
    getCurrentUser,
} = window.vendetta?.users || {};

const {
    getSetting,
} = window.vendetta?.settings || {};

/* ---------------------------------------------------------
 * Plugin metadata
 * ------------------------------------------------------- */

const PLUGIN_NAME = "Mobile Mod View";
const VERSION = "1.0.0";

/* ---------------------------------------------------------
 * React Native aliases
 * ------------------------------------------------------- */

const View = ReactNative?.View;
const Text = ReactNative?.Text;
const Pressable =
    ReactNative?.Pressable ||
    ReactNative?.TouchableOpacity;
const ScrollView = ReactNative?.ScrollView;
const Image = ReactNative?.Image;
const ActivityIndicator =
    ReactNative?.ActivityIndicator;
const Alert = ReactNative?.Alert;
const StyleSheet = ReactNative?.StyleSheet;

/* ---------------------------------------------------------
 * Colors
 * ------------------------------------------------------- */

const COLORS = {
    background: "#111214",
    surface: "#1e1f22",
    surface2: "#2b2d31",
    border: "#3f4147",
    text: "#f2f3f5",
    muted: "#b5bac1",
    blurple: "#5865f2",
    green: "#23a559",
    yellow: "#f0b232",
    red: "#ed4245",
};

/* ---------------------------------------------------------
 * Styles
 * ------------------------------------------------------- */

const styles = StyleSheet?.create({
    root: {
        flex: 1,
        backgroundColor:
            COLORS.background,
    },

    scroll: {
        padding: 16,
        paddingBottom: 40,
    },

    header: {
        alignItems: "center",
        paddingTop: 12,
        paddingBottom: 20,
    },

    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor:
            COLORS.surface2,
        marginBottom: 12,
    },

    username: {
        color: COLORS.text,
        fontSize: 21,
        fontWeight: "700",
    },

    tag: {
        color: COLORS.muted,
        fontSize: 14,
        marginTop: 3,
    },

    botBadge: {
        marginTop: 8,
        backgroundColor:
            COLORS.blurple,
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    botText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "800",
    },

    actions: {
        flexDirection: "row",
        marginBottom: 12,
    },

    action: {
        flex: 1,
        minHeight: 46,
        marginHorizontal: 3,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor:
            COLORS.surface2,
    },

    timeoutAction: {
        backgroundColor:
            COLORS.yellow,
    },

    banAction: {
        backgroundColor:
            COLORS.red,
    },

    actionText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: "700",
    },

    section: {
        backgroundColor:
            COLORS.surface,
        borderRadius: 10,
        marginBottom: 10,
        overflow: "hidden",
    },

    sectionHeader: {
        minHeight: 52,
        paddingHorizontal: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent:
            "space-between",
    },

    sectionTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: "700",
    },

    sectionArrow: {
        color: COLORS.muted,
        fontSize: 18,
    },

    sectionBody: {
        borderTopWidth: 1,
        borderTopColor:
            COLORS.border,
        padding: 14,
    },

    row: {
        flexDirection: "row",
        paddingVertical: 7,
    },

    label: {
        flex: 1,
        color: COLORS.muted,
        fontSize: 14,
    },

    value: {
        flex: 1.5,
        color: COLORS.text,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "right",
    },

    roles: {
        flexDirection: "row",
        flexWrap: "wrap",
    },

    role: {
        backgroundColor:
            COLORS.surface2,
        borderRadius: 6,
        paddingHorizontal: 9,
        paddingVertical: 7,
        marginRight: 7,
        marginBottom: 7,
    },

    roleText: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: "600",
    },

    message: {
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor:
            COLORS.border,
    },

    messageDate: {
        color: COLORS.muted,
        fontSize: 11,
        marginBottom: 5,
    },

    messageText: {
        color: COLORS.text,
        fontSize: 14,
        lineHeight: 20,
    },

    deleteText: {
        color: COLORS.red,
        fontSize: 13,
        fontWeight: "700",
        marginTop: 8,
    },

    empty: {
        color: COLORS.muted,
        textAlign: "center",
        paddingVertical: 12,
        lineHeight: 20,
    },

    loading: {
        color: COLORS.muted,
        textAlign: "center",
        paddingVertical: 15,
    },
});

/* ---------------------------------------------------------
 * Helpers
 * ------------------------------------------------------- */

function safeString(value, fallback) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return fallback || "Unknown";
    }

    return String(value);
}

function getDisplayName(user) {
    return (
        user?.global_name ||
        user?.username ||
        "Unknown User"
    );
}

function getUsername(user) {
    if (!user?.username) {
        return "Unknown";
    }

    if (
        user.discriminator &&
        user.discriminator !== "0"
    ) {
        return (
            "@" +
            user.username +
            "#" +
            user.discriminator
        );
    }

    return "@" + user.username;
}

function formatDate(value) {
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

function snowflakeDate(id) {
    try {
        const timestamp =
            Number(
                BigInt(id) >>
                    BigInt(22),
            ) +
            1420070400000;

        return new Date(
            timestamp,
        ).toLocaleString();
    } catch {
        return "Unknown";
    }
}

function getAvatar(user) {
    if (!user?.avatar) {
        return null;
    }

    const extension =
        user.avatar.startsWith("a_")
            ? "gif"
            : "png";

    return (
        "https://cdn.discordapp.com/avatars/" +
        user.id +
        "/" +
        user.avatar +
        "." +
        extension +
        "?size=256"
    );
}

/* ---------------------------------------------------------
 * Store helpers
 * ------------------------------------------------------- */

function getGuildId() {
    try {
        const store =
            findByProps?.(
                "getGuildId",
                "getLastSelectedGuildId",
            );

        return (
            store?.getGuildId?.() ||
            store?.getLastSelectedGuildId?.()
        );
    } catch {
        return null;
    }
}

function getChannelId() {
    try {
        const store =
            findByProps?.(
                "getChannelId",
                "getCurrentlySelectedChannelId",
            );

        return (
            store?.getChannelId?.() ||
            store?.getCurrentlySelectedChannelId?.()
        );
    } catch {
        return null;
    }
}

/* ---------------------------------------------------------
 * REST
 *
 * Bunny exposes the Discord REST API through the existing
 * client session. We deliberately do NOT ask for or store
 * a Discord token.
 * ------------------------------------------------------- */

async function apiRequest(
    method,
    endpoint,
    body,
) {
    try {
        const RestAPI =
            findByProps?.(
                "get",
                "post",
                "put",
                "patch",
                "del",
            );

        if (!RestAPI) {
            throw new Error(
                "Discord REST API unavailable",
            );
        }

        const options = {
            url: endpoint,
        };

        if (body !== undefined) {
            options.body = body;
        }

        switch (method) {
            case "GET":
                return (
                    await RestAPI.get(
                        options,
                    )
                )?.body;

            case "POST":
                return (
                    await RestAPI.post(
                        options,
                    )
                )?.body;

            case "PUT":
                return (
                    await RestAPI.put(
                        options,
                    )
                )?.body;

            case "PATCH":
                return (
                    await RestAPI.patch(
                        options,
                    )
                )?.body;

            case "DELETE":
                return (
                    await RestAPI.del(
                        options,
                    )
                )?.body;

            default:
                throw new Error(
                    "Unsupported method",
                );
        }
    } catch (error) {
        console.error(
            `[${PLUGIN_NAME}] REST error`,
            error,
        );

        throw error;
    }
}

async function getMember(
    guildId,
    userId,
) {
    return apiRequest(
        "GET",
        `/guilds/${guildId}/members/${userId}`,
    );
}

async function getGuild(
    guildId,
) {
    return apiRequest(
        "GET",
        `/guilds/${guildId}`,
    );
}

async function getMessages(
    channelId,
    userId,
) {
    const messages =
        await apiRequest(
            "GET",
            `/channels/${channelId}/messages?limit=100`,
        );

    if (!Array.isArray(messages)) {
        return [];
    }

    return messages
        .filter(
            (message) =>
                message?.author?.id ===
                userId,
        )
        .slice(0, 30);
}

/* ---------------------------------------------------------
 * Moderation
 * ------------------------------------------------------- */

async function setTimeoutUser(
    guildId,
    userId,
    minutes,
) {
    const until =
        new Date(
            Date.now() +
                minutes *
                    60 *
                    1000,
        ).toISOString();

    return apiRequest(
        "PATCH",
        `/guilds/${guildId}/members/${userId}`,
        {
            communication_disabled_until:
                until,
        },
    );
}

async function removeTimeoutUser(
    guildId,
    userId,
) {
    return apiRequest(
        "PATCH",
        `/guilds/${guildId}/members/${userId}`,
        {
            communication_disabled_until:
                null,
        },
    );
}

async function kickUser(
    guildId,
    userId,
) {
    return apiRequest(
        "DELETE",
        `/guilds/${guildId}/members/${userId}`,
    );
}

async function banUser(
    guildId,
    userId,
) {
    return apiRequest(
        "PUT",
        `/guilds/${guildId}/bans/${userId}`,
        {
            delete_message_seconds: 0,
        },
    );
}

async function deleteMessage(
    channelId,
    messageId,
) {
    return apiRequest(
        "DELETE",
        `/channels/${channelId}/messages/${messageId}`,
    );
}

/* ---------------------------------------------------------
 * Confirmation
 * ------------------------------------------------------- */

function confirmAction(
    title,
    message,
    callback,
) {
    if (!Alert?.alert) {
        callback();
        return;
    }

    Alert.alert(
        title,
        message,
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
                        await callback();

                        showToast?.(
                            title +
                                " completed",
                            getAssetIDByName?.(
                                "Check",
                            ),
                        );
                    } catch (error) {
                        console.error(
                            `[${PLUGIN_NAME}]`,
                            error,
                        );

                        showToast?.(
                            title +
                                " failed",
                            getAssetIDByName?.(
                                "ic_warning",
                            ),
                        );
                    }
                },
            },
        ],
    );
}

/* ---------------------------------------------------------
 * Components
 * ------------------------------------------------------- */

function InfoRow({
    label,
    value,
}) {
    return React.createElement(
        View,
        {
            style: styles.row,
        },
        React.createElement(
            Text,
            {
                style: styles.label,
            },
            label,
        ),
        React.createElement(
            Text,
            {
                style: styles.value,
                numberOfLines: 2,
            },
            safeString(value),
        ),
    );
}

function Section({
    title,
    children,
    defaultOpen = true,
}) {
    const [open, setOpen] =
        React.useState(
            defaultOpen,
        );

    return React.createElement(
        View,
        {
            style: styles.section,
        },

        React.createElement(
            Pressable,
            {
                style:
                    styles.sectionHeader,
                onPress: () =>
                    setOpen(!open),
            },

            React.createElement(
                Text,
                {
                    style:
                        styles.sectionTitle,
                },
                title,
            ),

            React.createElement(
                Text,
                {
                    style:
                        styles.sectionArrow,
                },
                open ? "⌃" : "⌄",
            ),
        ),

        open &&
            React.createElement(
                View,
                {
                    style:
                        styles.sectionBody,
                },
                children,
            ),
    );
}

/* ---------------------------------------------------------
 * Mod View Screen
 * ------------------------------------------------------- */

function ModView({
    user,
}) {
    const guildId =
        getGuildId();

    const channelId =
        getChannelId();

    const [member, setMember] =
        React.useState(null);

    const [guild, setGuild] =
        React.useState(null);

    const [messages, setMessages] =
        React.useState([]);

    const [loading, setLoading] =
        React.useState(true);

    const [refreshing, setRefreshing] =
        React.useState(false);

    async function load() {
        setLoading(true);

        try {
            if (guildId) {
                const results =
                    await Promise.all([
                        getMember(
                            guildId,
                            user.id,
                        ),
                        getGuild(
                            guildId,
                        ),
                    ]);

                setMember(
                    results[0],
                );

                setGuild(
                    results[1],
                );
            }

            if (channelId) {
                setMessages(
                    await getMessages(
                        channelId,
                        user.id,
                    ),
                );
            }
        } catch (error) {
            console.error(
                `[${PLUGIN_NAME}] Load failed`,
                error,
            );
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

    const roles =
        guild?.roles || [];

    const roleMap =
        {};

    roles.forEach(
        (role) => {
            roleMap[role.id] =
                role;
        },
    );

    function doTimeout() {
        if (!guildId) {
            showToast?.(
                "No server selected",
            );
            return;
        }

        if (timedOut) {
            confirmAction(
                "Remove Timeout",
                "Remove this user's timeout?",
                async () => {
                    await removeTimeoutUser(
                        guildId,
                        user.id,
                    );

                    await load();
                },
            );

            return;
        }

        confirmAction(
            "Timeout User",
            "Timeout this user for 10 minutes?",
            async () => {
                await setTimeoutUser(
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

        confirmAction(
            "Kick User",
            "Kick " +
                getDisplayName(
                    user,
                ) +
                " from this server?",
            async () => {
                await kickUser(
                    guildId,
                    user.id,
                );

                showToast?.(
                    "User kicked",
                );
            },
        );
    }

    function doBan() {
        if (!guildId) {
            return;
        }

        confirmAction(
            "Ban User",
            "Ban " +
                getDisplayName(
                    user,
                ) +
                " from this server?",
            async () => {
                await banUser(
                    guildId,
                    user.id,
                );

                showToast?.(
                    "User banned",
                );
            },
        );
    }

    async function refresh() {
        setRefreshing(true);

        await load();

        setRefreshing(false);
    }

    const avatar =
        getAvatar(user);

    return React.createElement(
        View,
        {
            style: styles.root,
        },

        React.createElement(
            ScrollView,
            {
                style: styles.root,
                contentContainerStyle:
                    styles.scroll,

                refreshControl:
                    ReactNative
                        ?.RefreshControl
                        ? React.createElement(
                              ReactNative.RefreshControl,
                              {
                                  refreshing:
                                      refreshing,
                                  onRefresh:
                                      refresh,
                              },
                          )
                        : undefined,
            },

            /* Header */

            React.createElement(
                View,
                {
                    style: styles.header,
                },

                avatar
                    ? React.createElement(
                          Image,
                          {
                              source: {
                                  uri: avatar,
                              },
                              style:
                                  styles.avatar,
                          },
                      )
                    : React.createElement(
                          View,
                          {
                              style:
                                  styles.avatar,
                          },
                      ),

                React.createElement(
                    Text,
                    {
                        style:
                            styles.username,
                    },
                    getDisplayName(
                        user,
                    ),
                ),

                React.createElement(
                    Text,
                    {
                        style:
                            styles.tag,
                    },
                    getUsername(
                        user,
                    ),
                ),

                user.bot &&
                    React.createElement(
                        View,
                        {
                            style:
                                styles.botBadge,
                        },
                        React.createElement(
                            Text,
                            {
                                style:
                                    styles.botText,
                            },
                            "BOT",
                        ),
                    ),
            ),

            /* Moderation buttons */

            guildId &&
                React.createElement(
                    View,
                    {
                        style:
                            styles.actions,
                    },

                    React.createElement(
                        Pressable,
                        {
                            style: [
                                styles.action,
                                timedOut &&
                                    styles.timeoutAction,
                            ],
                            onPress:
                                doTimeout,
                        },
                        React.createElement(
                            Text,
                            {
                                style:
                                    styles.actionText,
                            },
                            timedOut
                                ? "Remove Timeout"
                                : "Timeout",
                        ),
                    ),

                    React.createElement(
                        Pressable,
                        {
                            style:
                                styles.action,
                            onPress:
                                doKick,
                        },
                        React.createElement(
                            Text,
                            {
                                style:
                                    styles.actionText,
                            },
                            "Kick",
                        ),
                    ),

                    React.createElement(
                        Pressable,
                        {
                            style: [
                                styles.action,
                                styles.banAction,
                            ],
                            onPress:
                                doBan,
                        },
                        React.createElement(
                            Text,
                            {
                                style:
                                    styles.actionText,
                            },
                            "Ban",
                        ),
                    ),
                ),

            /* User information */

            React.createElement(
                Section,
                {
                    title:
                        "User Information",
                },

                React.createElement(
                    InfoRow,
                    {
                        label:
                            "User ID",
                        value:
                            user.id,
                    },
                ),

                React.createElement(
                    InfoRow,
                    {
                        label:
                            "Account Created",
                        value:
                            snowflakeDate(
                                user.id,
                            ),
                    },
                ),

                React.createElement(
                    InfoRow,
                    {
                        label:
                            "Username",
                        value:
                            getUsername(
                                user,
                            ),
                    },
                ),

                React.createElement(
                    InfoRow,
                    {
                        label:
                            "Bot",
                        value:
                            user.bot
                                ? "Yes"
                                : "No",
                    },
                ),

                React.createElement(
                    InfoRow,
                    {
                        label:
                            "Nickname",
                        value:
                            member?.nick ||
                            "None",
                    },
                ),

                React.createElement(
                    InfoRow,
                    {
                        label:
                            "Server Joined",
                        value:
                            formatDate(
                                member?.joined_at,
                            ),
                    },
                ),

                React.createElement(
                    InfoRow,
                    {
                        label:
                            "Timeout",
                        value:
                            timedOut
                                ? formatDate(
                                      member.communication_disabled_until,
                                  )
                                : "None",
                    },
                ),
            ),

            /* Roles */

            React.createElement(
                Section,
                {
                    title:
                        "Roles (" +
                        (member?.roles
                            ?.length ||
                            0) +
                        ")",
                },

                member?.roles?.length
                    ? React.createElement(
                          View,
                          {
                              style:
                                  styles.roles,
                          },

                          member.roles
                              .map(
                                  (
                                      id,
                                  ) =>
                                      roleMap[
                                          id
                                      ],
                              )
                              .filter(
                                  Boolean,
                              )
                              .sort(
                                  (
                                      a,
                                      b,
                                  ) =>
                                      (b.position ||
                                          0) -
                                      (a.position ||
                                          0),
                              )
                              .map(
                                  (
                                      role,
                                  ) =>
                                      React.createElement(
                                          View,
                                          {
                                              key:
                                                  role.id,
                                              style:
                                                  styles.role,
                                          },

                                          React.createElement(
                                              Text,
                                              {
                                                  style:
                                                      styles.roleText,
                                              },
                                              role.name,
                                          ),
                                      ),
                              ),
                      )
                    : React.createElement(
                          Text,
                          {
                              style:
                                  styles.empty,
                          },
                          "No roles found.",
                      ),
            ),

            /* Server */

            React.createElement(
                Section,
                {
                    title:
                        "Server Information",
                    defaultOpen:
                        false,
                },

                React.createElement(
                    InfoRow,
                    {
                        label:
                            "Server",
                        value:
                            guild?.name ||
                            "Unknown",
                    },
                ),

                React.createElement(
                    InfoRow,
                    {
                        label:
                            "Server ID",
                        value:
                            guildId ||
                            "Unknown",
                    },
                ),

                React.createElement(
                    InfoRow,
                    {
                        label:
                            "Role Count",
                        value:
                            String(
                                roles.length,
                            ),
                    },
                ),
            ),

            /* Recent messages */

            React.createElement(
                Section,
                {
                    title:
                        "Recent Messages (" +
                        messages.length +
                        ")",
                },

                messages.length ===
                    0
                    ? React.createElement(
                          Text,
                          {
                              style:
                                  styles.empty,
                          },
                          "No recent messages from this user were found in the current channel.",
                      )
                    : messages.map(
                          (
                              message,
                          ) =>
                              React.createElement(
                                  View,
                                  {
                                      key:
                                          message.id,
                                      style:
                                          styles.message,
                                  },

                                  React.createElement(
                                      Text,
                                      {
                                          style:
                                              styles.messageDate,
                                      },
                                      formatDate(
                                          message.timestamp,
                                      ),
                                  ),

                                  React.createElement(
                                      Text,
                                      {
                                          style:
                                              styles.messageText,
                                      },
                                      message.content ||
                                          "[Attachment / no text]",
                                  ),

                                  React.createElement(
                                      Pressable,
                                      {
                                          onPress:
                                              () =>
                                                  confirmAction(
                                                      "Delete Message",
                                                      "Permanently delete this message?",
                                                      async () => {
                                                          await deleteMessage(
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
                                                  ),
                                      },

                                      React.createElement(
                                          Text,
                                          {
                                              style:
                                                  styles.deleteText,
                                          },
                                          "Delete Message",
                                      ),
                                  ),
                              ),
                      ),
            ),

            loading &&
                React.createElement(
                    Text,
                    {
                        style:
                            styles.loading,
                    },
                    "Loading moderator data...",
                ),
        ),
    );
}

/* ---------------------------------------------------------
 * Extract a Discord user from props
 * ------------------------------------------------------- */

function extractUser(
    props,
) {
    if (!props) {
        return null;
    }

    const candidates = [
        props.user,
        props.userData,
        props.targetUser,
        props.profile?.user,
        props.profile?.userData,
        props.userProfile?.user,
        props.member?.user,
        props.guildMember?.user,
    ];

    for (
        const candidate of
            candidates
    ) {
        if (
            candidate &&
            typeof candidate ===
                "object" &&
            typeof candidate.id ===
                "string"
        ) {
            return candidate;
        }
    }

    return null;
}

/* ---------------------------------------------------------
 * Open Mod View
 * ------------------------------------------------------- */

function openModView(
    user,
) {
    if (!user?.id) {
        return;
    }

    try {
        /*
         * Prefer Bunny/Vendetta's navigation.
         */
        if (
            NavigationNative?.push
        ) {
            NavigationNative.push(
                "MobileModView",
                {
                    user,
                },
            );

            return;
        }
    } catch (error) {
        console.error(
            `[${PLUGIN_NAME}] Navigation error`,
            error,
        );
    }

    try {
        /*
         * Fallback modal.
         */
        if (openModal) {
            openModal(
                (props) =>
                    React.createElement(
                        ModView,
                        {
                            ...props,
                            user,
                        },
                    ),
            );

            return;
        }
    } catch (error) {
        console.error(
            `[${PLUGIN_NAME}] Modal error`,
            error,
        );
    }

    showToast?.(
        "Unable to open Mod View",
    );
}

/* ---------------------------------------------------------
 * Search an object tree for action arrays
 * ------------------------------------------------------- */

function patchActionArray(
    array,
    user,
) {
    if (!Array.isArray(array)) {
        return false;
    }

    /*
     * Already inserted.
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
     * Identify action-like arrays.
     */
    const actionLike =
        array.some(
            (item) => {
                const props =
                    item?.props;

                return (
                    props &&
                    (
                        typeof props
                            .onPress ===
                            "function" ||
                        typeof props
                            .onClick ===
                            "function" ||
                        typeof props
                            .label ===
                            "string" ||
                        typeof props
                            .text ===
                            "string"
                    )
                );
            },
        );

    if (!actionLike) {
        return false;
    }

    /*
     * Use a simple React Native button.
     */
    array.push(
        React.createElement(
            Pressable,
            {
                key:
                    "mobile-mod-view",
                accessibilityRole:
                    "button",
                accessibilityLabel:
                    "Mod View",
                onPress:
                    () =>
                        openModView(
                            user,
                        ),
                style: {
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                },
            },

            React.createElement(
                Text,
                {
                    style: {
                        color:
                            COLORS.text,
                        fontSize: 16,
                        fontWeight:
                            "600",
                    },
                },
                "🛡️ Mod View",
            ),
        ),
    );

    return true;
}

/* ---------------------------------------------------------
 * Walk React tree
 * ------------------------------------------------------- */

function walkTree(
    node,
    user,
    depth,
) {
    if (
        !node ||
        depth > 10
    ) {
        return false;
    }

    if (
        Array.isArray(node)
    ) {
        if (
            patchActionArray(
                node,
                user,
            )
        ) {
            return true;
        }

        for (
            const child of
                node
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
        typeof node !==
        "object"
    ) {
        return false;
    }

    /*
     * Check props.
     */
    if (
        node.props
    ) {
        const propsUser =
            extractUser(
                node.props,
            );

        if (
            propsUser?.id ===
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

    /*
     * Traverse children/React elements.
     */
    const keys =
        Object.keys(node);

    for (
        const key of keys
    ) {
        /*
         * Avoid circular React internals.
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

/* ---------------------------------------------------------
 * Find profile/action components
 * ------------------------------------------------------- */

function getCandidateModules() {
    const names = [
        "UserProfile",
        "UserProfileScreen",
        "UserProfileModal",
        "UserProfileHeader",
        "UserProfileContent",
        "ProfileActionSheet",
        "UserProfileActions",
        "ProfileActions",
        "ActionSheet",
        "BottomSheet",
        "ContextMenu",
    ];

    const modules = [];

    for (
        const name of names
    ) {
        try {
            const module =
                findByName?.(
                    name,
                    false,
                );

            if (
                module &&
                !modules.includes(
                    module,
                )
            ) {
                modules.push(
                    module,
                );
            }
        } catch {}
    }

    return modules;
}

/* ---------------------------------------------------------
 * Patch profile components
 * ------------------------------------------------------- */

function patchProfiles() {
    const modules =
        getCandidateModules();

    for (
        const module of
            modules
    ) {
        const target =
            module?.default ||
            module;

        if (
            typeof target !==
            "function"
        ) {
            continue;
        }

        try {
            after(
                "render",
                target,
                (
                    args,
                    result,
                ) => {
                    try {
                        const user =
                            extractUser(
                                args?.[0],
                            ) ||
                            extractUser(
                                result?.props,
                            );

                        if (
                            !user?.id
                        ) {
                            return result;
                        }

                        walkTree(
                            result,
                            user,
                            0,
                        );
                    } catch (
                        error
                    ) {
                        console.error(
                            `[${PLUGIN_NAME}] Profile patch error`,
                            error,
                        );
                    }

                    return result;
                },
            );
        } catch (
            error
        ) {
            console.error(
                `[${PLUGIN_NAME}] Failed to patch`,
                error,
            );
        }
    }
}

/* ---------------------------------------------------------
 * Plugin lifecycle
 * ------------------------------------------------------- */

let loaded = false;

function start() {
    if (loaded) {
        return;
    }

    loaded = true;

    console.log(
        `[${PLUGIN_NAME}] Starting v${VERSION}`,
    );

    try {
        patchProfiles();
    } catch (error) {
        console.error(
            `[${PLUGIN_NAME}]`,
            error,
        );
    }

    console.log(
        `[${PLUGIN_NAME}] Loaded`,
    );
}

function stop() {
    if (!loaded) {
        return;
    }

    loaded = false;

    try {
        unpatchAll?.();
    } catch (error) {
        console.error(
            `[${PLUGIN_NAME}] Unpatch failed`,
            error,
        );
    }

    console.log(
        `[${PLUGIN_NAME}] Unloaded`,
    );
}

/* ---------------------------------------------------------
 * Bunny/Vendetta plugin export
 * ------------------------------------------------------- */

module.exports = {
    onLoad: start,
    onUnload: stop,

    start,
    stop,

    default: {
        onLoad: start,
        onUnload: stop,
    },
};
