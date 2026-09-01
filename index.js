(function (p, m, q, c, ui) {
    "use strict";

    // This wrapper/API layout is intentionally the same proven Bunny/Vendetta
    // layout used by the working test plugin.
    const React = c.React;
    const RN = c.ReactNative;

    const findByName = m.findByName;
    const findByProps = m.findByProps;
    const after = q.after;

    const clipboard = c.clipboard;
    const showToast = ui?.toasts?.showToast;

    const View = RN.View;
    const Text = RN.Text;
    const Pressable = RN.Pressable || RN.TouchableOpacity;
    const StyleSheet = RN.StyleSheet;
    const ActivityIndicator = RN.ActivityIndicator;

    const disposers = [];

    const COLORS = {
        surface: "#1e1f22",
        surface2: "#2b2d31",
        border: "#3f4147",
        text: "#f2f3f5",
        muted: "#b5bac1"
    };

    const styles = StyleSheet.create({
        wrapper: {
            width: "100%",
            alignItems: "center"
        },

        card: {
            width: "100%",
            marginTop: 10,
            marginBottom: 2,
            backgroundColor: COLORS.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            overflow: "hidden"
        },

        title: {
            color: COLORS.text,
            fontSize: 15,
            fontWeight: "800",
            paddingHorizontal: 14,
            paddingTop: 13,
            paddingBottom: 10
        },

        divider: {
            height: 1,
            backgroundColor: COLORS.border
        },

        subsection: {
            color: COLORS.muted,
            fontSize: 10,
            fontWeight: "800",
            paddingHorizontal: 14,
            paddingTop: 11,
            paddingBottom: 3,
            letterSpacing: 0.5
        },

        row: {
            minHeight: 39,
            paddingHorizontal: 14,
            paddingVertical: 7,
            flexDirection: "row",
            alignItems: "center"
        },

        rowPressed: {
            opacity: 0.55
        },

        label: {
            flex: 1,
            color: COLORS.muted,
            fontSize: 12
        },

        value: {
            flex: 1.8,
            color: COLORS.text,
            fontSize: 12,
            fontWeight: "600",
            textAlign: "right"
        },

        roleBlock: {
            marginHorizontal: 14,
            marginBottom: 9,
            backgroundColor: COLORS.surface2,
            borderRadius: 8,
            overflow: "hidden"
        },

        roleRow: {
            minHeight: 36,
            paddingHorizontal: 11,
            paddingVertical: 6,
            justifyContent: "center"
        },

        roleRowBorder: {
            borderTopWidth: 1,
            borderTopColor: COLORS.border
        },

        roleLabel: {
            color: COLORS.muted,
            fontSize: 10,
            marginBottom: 2
        },

        roleValue: {
            color: COLORS.text,
            fontSize: 12,
            fontWeight: "600"
        },

        message: {
            marginHorizontal: 14,
            paddingVertical: 9,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border
        },

        messageDate: {
            color: COLORS.muted,
            fontSize: 10,
            marginBottom: 4
        },

        messageText: {
            color: COLORS.text,
            fontSize: 12,
            lineHeight: 18
        },

        messageHint: {
            color: COLORS.muted,
            fontSize: 9,
            marginTop: 4
        },

        empty: {
            color: COLORS.muted,
            fontSize: 12,
            textAlign: "center",
            paddingHorizontal: 14,
            paddingVertical: 11
        },

        loading: {
            minHeight: 46,
            alignItems: "center",
            justifyContent: "center"
        }
    });

    function toast(message) {
        try {
            if (typeof showToast === "function") {
                showToast(message);
            } else {
                console.log("[Mobile Mod View]", message);
            }
        } catch (error) {
            console.error("[Mobile Mod View] toast", error);
        }
    }

    function copyText(value, label) {
        if (value === null || value === undefined || value === "") {
            toast("Nothing to copy");
            return;
        }

        const text = String(value);

        try {
            if (clipboard && typeof clipboard.setString === "function") {
                clipboard.setString(text);
                toast(label + " copied");
                return;
            }
        } catch (error) {
            console.error("[Mobile Mod View] clipboard", error);
        }

        try {
            if (typeof findByProps === "function") {
                const fallback = findByProps("setString");
                if (
                    fallback &&
                    typeof fallback.setString === "function"
                ) {
                    fallback.setString(text);
                    toast(label + " copied");
                    return;
                }
            }
        } catch (error) {
            console.error(
                "[Mobile Mod View] clipboard fallback",
                error
            );
        }

        toast("Clipboard unavailable");
    }

    function formatDate(value) {
        if (!value) return "Unknown";

        try {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "Unknown";
            return date.toLocaleString();
        } catch {
            return "Unknown";
        }
    }

    function getAccountCreationDate(id) {
        if (!id) return "Unknown";

        try {
            const milliseconds =
                Number((BigInt(String(id)) >> 22n)) +
                1420070400000;

            return formatDate(milliseconds);
        } catch {
            return "Unknown";
        }
    }

    function getExplicitGuildId(props) {
        // Never use SelectedGuildStore here. A global/self profile should not
        // inherit an unrelated server just because it is selected elsewhere.
        return (
            props?.guildId ||
            props?.guild_id ||
            props?.guild?.id ||
            props?.guild?.guild_id ||
            props?.profile?.guildId ||
            props?.profile?.guild_id ||
            props?.profile?.guild?.id ||
            null
        );
    }

    function getChannelId() {
        try {
            const store =
                typeof m.findByStoreName === "function"
                    ? m.findByStoreName("SelectedChannelStore")
                    : null;

            return store?.getChannelId?.() || null;
        } catch {
            return null;
        }
    }

    function getRest() {
        try {
            if (typeof findByProps !== "function") return null;

            return (
                findByProps("get", "post", "put", "patch", "del") ||
                findByProps("get") ||
                null
            );
        } catch {
            return null;
        }
    }

    async function get(url) {
        const rest = getRest();

        if (!rest || typeof rest.get !== "function") {
            throw new Error("Discord REST API unavailable");
        }

        const response = await rest.get({ url: url });
        return response?.body;
    }

    async function fetchMember(guildId, userId) {
        return get(
            "/guilds/" + guildId + "/members/" + userId
        );
    }

    async function fetchGuild(guildId) {
        return get("/guilds/" + guildId);
    }

    async function fetchRecentMessages(channelId, userId) {
        const data = await get(
            "/channels/" +
                channelId +
                "/messages?limit=50"
        );

        if (!Array.isArray(data)) return [];

        return data
            .filter(message => message?.author?.id === userId)
            .slice(0, 15);
    }

    function CopyRow({ label, value }) {
        const display =
            value === null ||
            value === undefined ||
            value === ""
                ? "Unknown"
                : String(value);

        return React.createElement(
            Pressable,
            {
                onPress: () => copyText(value, label),
                style: styles.row,
                accessibilityRole: "button",
                accessibilityLabel: "Copy " + label
            },
            React.createElement(
                Text,
                { style: styles.label },
                label
            ),
            React.createElement(
                Text,
                {
                    style: styles.value,
                    numberOfLines: 2
                },
                display
            )
        );
    }

    function RoleBlock({ role }) {
        return React.createElement(
            View,
            { style: styles.roleBlock },

            React.createElement(
                Pressable,
                {
                    onPress: () =>
                        copyText(role.name, "Role name"),
                    style: styles.roleRow,
                    accessibilityRole: "button",
                    accessibilityLabel:
                        "Copy role name " + role.name
                },
                React.createElement(
                    Text,
                    { style: styles.roleLabel },
                    "ROLE NAME"
                ),
                React.createElement(
                    Text,
                    { style: styles.roleValue },
                    role.name
                )
            ),

            React.createElement(
                Pressable,
                {
                    onPress: () =>
                        copyText(role.id, "Role ID"),
                    style: [styles.roleRow, styles.roleRowBorder],
                    accessibilityRole: "button",
                    accessibilityLabel:
                        "Copy role ID"
                },
                React.createElement(
                    Text,
                    { style: styles.roleLabel },
                    "ROLE ID"
                ),
                React.createElement(
                    Text,
                    { style: styles.roleValue },
                    role.id
                )
            )
        );
    }

    function MemberInformation({ user, guildId }) {
        const [member, setMember] = React.useState(null);
        const [roles, setRoles] = React.useState([]);
        const [messages, setMessages] = React.useState([]);
        const [loading, setLoading] = React.useState(false);
        const [refreshing, setRefreshing] = React.useState(false);

        async function load() {
            if (!guildId || !user?.id) {
                setMember(null);
                setRoles([]);
                setMessages([]);
                setLoading(false);
                return;
            }

            setLoading(true);

            // Fetch member first. If this fails, the profile still renders.
            let memberData = null;
            let guildData = null;

            try {
                memberData = await fetchMember(guildId, user.id);
                setMember(memberData || null);
            } catch (error) {
                console.error(
                    "[Mobile Mod View] member fetch",
                    error
                );
                setMember(null);
            }

            try {
                guildData = await fetchGuild(guildId);
            } catch (error) {
                console.error(
                    "[Mobile Mod View] guild fetch",
                    error
                );
            }

            const guildRoles = Array.isArray(guildData?.roles)
                ? guildData.roles
                : [];

            const roleMap = {};
            guildRoles.forEach(role => {
                if (role?.id) roleMap[role.id] = role;
            });

            const memberRoleIds = Array.isArray(memberData?.roles)
                ? memberData.roles
                : [];

            setRoles(
                memberRoleIds
                    .map(id => roleMap[id])
                    .filter(Boolean)
            );

            const channelId = getChannelId();

            if (channelId) {
                try {
                    setMessages(
                        await fetchRecentMessages(
                            channelId,
                            user.id
                        )
                    );
                } catch (error) {
                    console.error(
                        "[Mobile Mod View] message fetch",
                        error
                    );
                    setMessages([]);
                }
            } else {
                setMessages([]);
            }

            setLoading(false);
        }

        React.useEffect(() => {
            load();
        }, [user?.id, guildId]);

        async function refresh() {
            if (refreshing) return;
            setRefreshing(true);
            await load();
            setRefreshing(false);
        }

        return React.createElement(
            View,
            { style: styles.card },

            React.createElement(
                Text,
                { style: styles.title },
                "Member Information"
            ),

            React.createElement(View, {
                style: styles.divider
            }),

            React.createElement(
                SectionTitle,
                null,
                "USER"
            ),

            React.createElement(CopyRow, {
                label: "Username",
                value: user?.username
            }),

            React.createElement(CopyRow, {
                label: "Display Name",
                value:
                    user?.global_name ||
                    user?.username
            }),

            React.createElement(CopyRow, {
                label: "User ID",
                value: user?.id
            }),

            guildId
                ? React.createElement(
                      React.Fragment,
                      null,

                      React.createElement(
                          SectionTitle,
                          null,
                          "MEMBER"
                      ),

                      React.createElement(CopyRow, {
                          label: "Nickname",
                          value: member?.nick || "None"
                      }),

                      React.createElement(CopyRow, {
                          label: "Server ID",
                          value: guildId
                      }),

                      React.createElement(
                          SectionTitle,
                          null,
                          "ROLES"
                      ),

                roles.length
                    ? roles.map(role =>
                          React.createElement(
                              RoleBlock,
                              {
                                  key: role.id,
                                  role: role
                              }
                          )
                      )
                    : React.createElement(
                          Text,
                          { style: styles.empty },
                          loading
                              ? "Loading roles..."
                              : "No roles found."
                      ),

                React.createElement(
                    SectionTitle,
                    null,
                    "RECENT MESSAGES"
                ),

                messages.length
                    ? messages.map(message =>
                          React.createElement(
                              Pressable,
                              {
                                  key: message.id,
                                  onPress: () =>
                                      copyText(
                                          message.content ||
                                              "[No text / attachment]",
                                          "Message"
                                      ),
                                  style: styles.message,
                                  accessibilityRole: "button",
                                  accessibilityLabel:
                                      "Copy message"
                              },
                              React.createElement(
                                  Text,
                                  { style: styles.messageDate },
                                  formatDate(
                                      message.timestamp
                                  )
                              ),
                              React.createElement(
                                  Text,
                                  {
                                      style:
                                          styles.messageText,
                                      numberOfLines: 6
                                  },
                                  message.content ||
                                      "[No text / attachment]"
                              ),
                              React.createElement(
                                  Text,
                                  { style: styles.messageHint },
                                  "Tap to copy"
                              )
                          )
                      )
                    : React.createElement(
                          Text,
                          { style: styles.empty },
                          "No recent messages found."
                      ),

                loading
                    ? React.createElement(
                          View,
                          { style: styles.loading },
                          ActivityIndicator
                              ? React.createElement(
                                    ActivityIndicator,
                                    { size: "small" }
                                )
                              : null
                      )
                    : null,

                      React.createElement(
                          Pressable,
                          {
                              onPress: refresh,
                              disabled: refreshing,
                              style: styles.row,
                              accessibilityRole: "button",
                              accessibilityLabel:
                                  "Refresh member information"
                          },
                          React.createElement(
                              Text,
                              { style: styles.label },
                              "Refresh"
                          ),
                          React.createElement(
                              Text,
                              { style: styles.value },
                              refreshing
                                  ? "Refreshing..."
                                  : "Tap to refresh"
                          )
                      )
                  )
                : null
        );
    }

    function SectionTitle({ children }) {
        return React.createElement(
            Text,
            { style: styles.subsection },
            children
        );
    }

    function patchHeaderAvatar() {
        if (
            typeof findByName !== "function" ||
            typeof after !== "function"
        ) {
            return false;
        }

        let HeaderAvatar = null;

        try {
            // This is the exact lookup that was proven to load in Bunny.
            HeaderAvatar = findByName("HeaderAvatar", false);
        } catch (error) {
            console.error(
                "[Mobile Mod View] HeaderAvatar lookup",
                error
            );
        }

        if (!HeaderAvatar) return false;

        try {
            const unpatch = after(
                "default",
                HeaderAvatar,
                (args, result) => {
                    try {
                        if (!result || !React.isValidElement(result)) {
                            return result;
                        }

                        const props = args?.[0] || {};
                        const resultProps = result?.props || {};

                        const user =
                            props.user ||
                            props.profile?.user ||
                            props.userInfo?.user ||
                            resultProps.user ||
                            null;

                        if (!user?.id) return result;

                        const guildId = getExplicitGuildId(props);

                        return React.createElement(
                            View,
                            {
                                style: styles.wrapper
                            },

                            result,

                            React.createElement(
                                MemberInformation,
                                {
                                    user: user,
                                    guildId: guildId
                                }
                            )
                        );
                    } catch (error) {
                        console.error(
                            "[Mobile Mod View] render",
                            error
                        );
                        return result;
                    }
                }
            );

            if (typeof unpatch === "function") {
                disposers.push(unpatch);
                return true;
            }
        } catch (error) {
            console.error(
                "[Mobile Mod View] patch",
                error
            );
        }

        return false;
    }

    function start() {
        try {
            if (patchHeaderAvatar()) {
                toast("Mobile Mod View enabled");
            } else {
                toast(
                    "Mobile Mod View: profile component not found"
                );
            }
        } catch (error) {
            console.error(
                "[Mobile Mod View] start",
                error
            );
        }
    }

    function stop() {
        while (disposers.length) {
            try {
                const dispose = disposers.pop();
                if (typeof dispose === "function") dispose();
            } catch (error) {
                console.error(
                    "[Mobile Mod View] unload",
                    error
                );
            }
        }
    }

    p.default = {
        onLoad: start,
        onUnload: stop
    };

    Object.defineProperty(p, "__esModule", {
        value: true
    });

    return p;
}) (
    {},
    vendetta.metro,
    vendetta.patcher,
    vendetta.metro.common,
    vendetta.ui
);
