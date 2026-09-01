(function (p, m, q, c, ui) {
    "use strict";

    const React = c.React;
    const RN = c.ReactNative;

    const findByName = m.findByName;
    const findByProps = m.findByProps;
    const findByStoreName = m.findByStoreName;
    const after = q.after;

    const View = RN.View;
    const Text = RN.Text;
    const ScrollView = RN.ScrollView;
    const Image = RN.Image;
    const StyleSheet = RN.StyleSheet;
    const ActivityIndicator = RN.ActivityIndicator;

    const showToast = ui?.toasts?.showToast;
    const disposers = [];

    const COLORS = {
        surface: "#1e1f22",
        surfaceAlt: "#2b2d31",
        border: "#3f4147",
        text: "#f2f3f5",
        muted: "#b5bac1",
        green: "#23a559"
    };

    const styles = StyleSheet.create({
        container: {
            width: "100%",
            marginTop: 10,
            paddingHorizontal: 12
        },
        card: {
            backgroundColor: COLORS.surface,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: COLORS.border
        },
        cardHeader: {
            minHeight: 48,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border
        },
        cardTitle: {
            flex: 1,
            color: COLORS.text,
            fontSize: 15,
            fontWeight: "800"
        },
        liveDot: {
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: COLORS.green,
            marginRight: 6
        },
        liveText: {
            color: COLORS.muted,
            fontSize: 10,
            fontWeight: "800"
        },
        profile: {
            padding: 14,
            flexDirection: "row",
            alignItems: "center"
        },
        profileAvatar: {
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: COLORS.surfaceAlt,
            marginRight: 12
        },
        profileText: {
            flex: 1
        },
        displayName: {
            color: COLORS.text,
            fontSize: 18,
            fontWeight: "800"
        },
        username: {
            color: COLORS.muted,
            fontSize: 13,
            marginTop: 2
        },
        section: {
            borderTopWidth: 1,
            borderTopColor: COLORS.border
        },
        sectionTitle: {
            color: COLORS.text,
            fontSize: 12,
            fontWeight: "800",
            paddingHorizontal: 14,
            paddingTop: 12,
            paddingBottom: 5
        },
        row: {
            minHeight: 32,
            paddingHorizontal: 14,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center"
        },
        label: {
            flex: 1,
            color: COLORS.muted,
            fontSize: 12
        },
        value: {
            flex: 1.7,
            color: COLORS.text,
            fontSize: 12,
            fontWeight: "600",
            textAlign: "right"
        },
        roleList: {
            paddingHorizontal: 14,
            paddingBottom: 12
        },
        role: {
            backgroundColor: COLORS.surfaceAlt,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 8,
            padding: 9,
            marginTop: 7
        },
        roleName: {
            color: COLORS.text,
            fontSize: 12,
            fontWeight: "700"
        },
        roleId: {
            color: COLORS.muted,
            fontSize: 10,
            marginTop: 3
        },
        messageList: {
            paddingHorizontal: 14,
            paddingBottom: 12
        },
        message: {
            backgroundColor: COLORS.surfaceAlt,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 8,
            padding: 9,
            marginTop: 7
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
        empty: {
            color: COLORS.muted,
            fontSize: 12,
            textAlign: "center",
            paddingHorizontal: 14,
            paddingVertical: 12,
            lineHeight: 18
        },
        loading: {
            paddingVertical: 12,
            alignItems: "center"
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

    function getAccountCreated(id) {
        if (!id) return "Unknown";

        try {
            const timestamp =
                Number((BigInt(String(id)) >> 22n)) +
                1420070400000;

            return formatDate(timestamp);
        } catch {
            return "Unknown";
        }
    }

    function getAvatarUrl(user) {
        if (!user?.id || !user?.avatar) return null;

        const hash = String(user.avatar);
        const extension = hash.startsWith("a_") ? "gif" : "png";

        return (
            "https://cdn.discordapp.com/avatars/" +
            user.id +
            "/" +
            hash +
            "." +
            extension +
            "?size=128"
        );
    }

    function getGuildId(provided) {
        if (provided) return provided;

        try {
            const store =
                typeof findByStoreName === "function"
                    ? findByStoreName("SelectedGuildStore")
                    : null;

            return store?.getGuildId?.() || null;
        } catch {
            return null;
        }
    }

    function getChannelId() {
        try {
            const store =
                typeof findByStoreName === "function"
                    ? findByStoreName("SelectedChannelStore")
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
                findByProps(
                    "get",
                    "post",
                    "put",
                    "patch",
                    "del"
                ) || findByProps("get")
            );
        } catch (error) {
            console.error(
                "[Mobile Mod View] REST lookup",
                error
            );
            return null;
        }
    }

    async function restGet(url) {
        const rest = getRest();

        if (!rest || typeof rest.get !== "function") {
            throw new Error("Discord REST API unavailable");
        }

        const response = await rest.get({ url: url });
        return response?.body;
    }

    async function fetchMember(guildId, userId) {
        if (!guildId || !userId) return null;

        return restGet(
            "/guilds/" + guildId + "/members/" + userId
        );
    }

    async function fetchGuild(guildId) {
        if (!guildId) return null;
        return restGet("/guilds/" + guildId);
    }

    async function fetchRecentMessages(channelId, userId) {
        if (!channelId || !userId) return [];

        const messages = await restGet(
            "/channels/" +
                channelId +
                "/messages?limit=50"
        );

        if (!Array.isArray(messages)) return [];

        return messages
            .filter(
                message =>
                    message?.author?.id === userId
            )
            .slice(0, 10);
    }

    function InfoRow({ label, value }) {
        return React.createElement(
            View,
            { style: styles.row },
            React.createElement(
                Text,
                { style: styles.label },
                label
            ),
            React.createElement(
                Text,
                {
                    style: styles.value,
                    numberOfLines: 4
                },
                value == null || value === ""
                    ? "Unavailable"
                    : String(value)
            )
        );
    }

    function RoleCard({ role }) {
        return React.createElement(
            View,
            { style: styles.role },
            React.createElement(
                Text,
                { style: styles.roleName },
                role?.name || "Unknown Role"
            ),
            React.createElement(
                Text,
                { style: styles.roleId },
                "Role ID: " + (role?.id || "Unknown")
            )
        );
    }

    function MessageCard({ message }) {
        const content =
            message?.content ||
            (message?.attachments?.length
                ? "[Attachment / no text]"
                : "[No text]");

        return React.createElement(
            View,
            { style: styles.message },
            React.createElement(
                Text,
                { style: styles.messageDate },
                formatDate(message?.timestamp)
            ),
            React.createElement(
                Text,
                { style: styles.messageText },
                content
            )
        );
    }

    function MobileModInfo({ user, suppliedGuildId }) {
        const guildId = getGuildId(suppliedGuildId);
        const channelId = getChannelId();

        const [member, setMember] = React.useState(null);
        const [guild, setGuild] = React.useState(null);
        const [messages, setMessages] = React.useState([]);
        const [loading, setLoading] = React.useState(true);

        async function load() {
            setLoading(true);

            try {
                if (guildId && user?.id) {
                    const memberResult =
                        await fetchMember(guildId, user.id)
                            .catch(error => {
                                console.error(
                                    "[Mobile Mod View] member fetch",
                                    error
                                );
                                return null;
                            });

                    const guildResult =
                        await fetchGuild(guildId)
                            .catch(error => {
                                console.error(
                                    "[Mobile Mod View] guild fetch",
                                    error
                                );
                                return null;
                            });

                    setMember(memberResult || null);
                    setGuild(guildResult || null);
                } else {
                    setMember(null);
                    setGuild(null);
                }

                if (channelId && user?.id) {
                    try {
                        const recent =
                            await fetchRecentMessages(
                                channelId,
                                user.id
                            );
                        setMessages(recent);
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
            } catch (error) {
                console.error(
                    "[Mobile Mod View] data load",
                    error
                );
            } finally {
                setLoading(false);
            }
        }

        React.useEffect(
            () => {
                load();
            },
            [user?.id, guildId, channelId]
        );

        const roleMap = {};
        const guildRoles =
            Array.isArray(guild?.roles)
                ? guild.roles
                : [];

        guildRoles.forEach(role => {
            if (role?.id) {
                roleMap[String(role.id)] = role;
            }
        });

        const memberRoleIds =
            Array.isArray(member?.roles)
                ? member.roles
                : [];

        const memberRoles = memberRoleIds
            .map(id => roleMap[String(id)])
            .filter(Boolean)
            .sort((a, b) =>
                Number(b?.position || 0) -
                Number(a?.position || 0)
            );

        const avatar = getAvatarUrl(user);

        return React.createElement(
            View,
            { style: styles.container },
            React.createElement(
                View,
                { style: styles.card },

                React.createElement(
                    View,
                    { style: styles.cardHeader },
                    React.createElement(
                        Text,
                        { style: styles.cardTitle },
                        "Moderator Information"
                    ),
                    React.createElement(
                        View,
                        { style: styles.liveDot }
                    ),
                    React.createElement(
                        Text,
                        { style: styles.liveText },
                        "READ ONLY"
                    )
                ),

                React.createElement(
                    View,
                    { style: styles.profile },
                    avatar
                        ? React.createElement(Image, {
                              source: { uri: avatar },
                              style: styles.profileAvatar
                          })
                        : React.createElement(View, {
                              style: styles.profileAvatar
                          }),
                    React.createElement(
                        View,
                        { style: styles.profileText },
                        React.createElement(
                            Text,
                            { style: styles.displayName },
                            user?.global_name ||
                                user?.username ||
                                "Unknown User"
                        ),
                        React.createElement(
                            Text,
                            { style: styles.username },
                            user?.username
                                ? "@" + user.username
                                : "Unknown"
                        )
                    )
                ),

                React.createElement(
                    View,
                    { style: styles.section },
                    React.createElement(
                        Text,
                        { style: styles.sectionTitle },
                        "USER INFORMATION"
                    ),
                    React.createElement(InfoRow, {
                        label: "Username",
                        value: user?.username
                    }),
                    React.createElement(InfoRow, {
                        label: "Display Name",
                        value:
                            user?.global_name ||
                            user?.username
                    }),
                    React.createElement(InfoRow, {
                        label: "User ID",
                        value: user?.id
                    }),
                    React.createElement(InfoRow, {
                        label: "Account Created",
                        value: getAccountCreated(user?.id)
                    })
                ),

                React.createElement(
                    View,
                    { style: styles.section },
                    React.createElement(
                        Text,
                        { style: styles.sectionTitle },
                        "SERVER INFORMATION"
                    ),
                    React.createElement(InfoRow, {
                        label: "Server ID",
                        value: guildId
                    }),
                    React.createElement(InfoRow, {
                        label: "Server Name",
                        value: guild?.name
                    }),
                    React.createElement(InfoRow, {
                        label: "Nickname",
                        value: member?.nick || "None"
                    }),
                    React.createElement(InfoRow, {
                        label: "Joined Server",
                        value: formatDate(member?.joined_at)
                    })
                ),

                React.createElement(
                    View,
                    { style: styles.section },
                    React.createElement(
                        Text,
                        { style: styles.sectionTitle },
                        "ROLES"
                    ),
                    memberRoles.length
                        ? React.createElement(
                              View,
                              { style: styles.roleList },
                              memberRoles.map(role =>
                                  React.createElement(
                                      RoleCard,
                                      {
                                          key: String(role.id),
                                          role: role
                                      }
                                  )
                              )
                          )
                        : React.createElement(
                              Text,
                              { style: styles.empty },
                              guildId
                                  ? "No roles available."
                                  : "No server selected."
                          )
                ),

                React.createElement(
                    View,
                    { style: styles.section },
                    React.createElement(
                        Text,
                        { style: styles.sectionTitle },
                        "RECENT MESSAGES"
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
                                  : null,
                              React.createElement(
                                  Text,
                                  { style: styles.empty },
                                  "Loading..."
                              )
                          )
                        : messages.length
                        ? React.createElement(
                              ScrollView,
                              {
                                  style: {
                                      maxHeight: 420
                                  },
                                  nestedScrollEnabled: true
                              },
                              React.createElement(
                                  View,
                                  { style: styles.messageList },
                                  messages.map(message =>
                                      React.createElement(
                                          MessageCard,
                                          {
                                              key: String(
                                                  message.id
                                              ),
                                              message: message
                                          }
                                      )
                                  )
                              )
                          )
                        : React.createElement(
                              Text,
                              { style: styles.empty },
                              channelId
                                  ? "No recent messages from this user in this channel."
                                  : "No channel selected."
                          )
                )
            )
        );
    }

    function patchProfile() {
        if (
            typeof findByName !== "function" ||
            typeof after !== "function"
        ) {
            return false;
        }

        let HeaderAvatar = null;

        try {
            HeaderAvatar = findByName(
                "HeaderAvatar",
                false
            );
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
                        const props = args?.[0];
                        const user = props?.user;

                        if (!user?.id || !result) {
                            return result;
                        }

                        return React.createElement(
                            View,
                            {
                                style: {
                                    width: "100%",
                                    alignItems: "center"
                                }
                            },
                            result,
                            React.createElement(
                                MobileModInfo,
                                {
                                    user: user,
                                    suppliedGuildId:
                                        props?.guildId
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
            if (!React || !RN || !StyleSheet) {
                console.error(
                    "[Mobile Mod View] React/ReactNative unavailable"
                );
                return;
            }

            if (patchProfile()) {
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
                if (typeof dispose === "function") {
                    dispose();
                }
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
})(
    {},
    vendetta.metro,
    vendetta.patcher,
    vendetta.metro.common,
    vendetta.ui
);
