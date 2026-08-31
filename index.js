(function(p, m, q, c, ui) {
    "use strict";

    const React = c.React;
    const RN = c.ReactNative;

    const findByName = m.findByName;
    const findByProps = m.findByProps;
    const findByStoreName = m.findByStoreName;

    const after = q.after;

    const showToast = ui.toasts.showToast;
    const showCustomAlert = ui.alerts.showCustomAlert;

    const View = RN.View;
    const Text = RN.Text;
    const Pressable = RN.Pressable || RN.TouchableOpacity;
    const ScrollView = RN.ScrollView;
    const Image = RN.Image;
    const StyleSheet = RN.StyleSheet;
    const Alert = RN.Alert;

    const COLORS = {
        background: "#111214",
        surface: "#1e1f22",
        surface2: "#2b2d31",
        border: "#3f4147",
        text: "#f2f3f5",
        muted: "#b5bac1",
        accent: "#5865f2",
        warning: "#f0b232",
        danger: "#ed4245",
        success: "#23a559"
    };

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: COLORS.background
        },
        content: {
            padding: 16,
            paddingBottom: 40
        },
        header: {
            alignItems: "center",
            paddingVertical: 12
        },
        avatar: {
            width: 82,
            height: 82,
            borderRadius: 41,
            backgroundColor: COLORS.surface2,
            marginBottom: 10
        },
        name: {
            color: COLORS.text,
            fontSize: 21,
            fontWeight: "700"
        },
        tag: {
            color: COLORS.muted,
            fontSize: 14,
            marginTop: 3
        },
        botBadge: {
            backgroundColor: COLORS.accent,
            borderRadius: 5,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginTop: 7
        },
        botText: {
            color: "#fff",
            fontSize: 11,
            fontWeight: "800"
        },
        actionRow: {
            flexDirection: "row",
            marginHorizontal: -3
        },
        action: {
            flex: 1,
            marginHorizontal: 3,
            minHeight: 46,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.surface2
        },
        actionWarning: {
            backgroundColor: COLORS.warning
        },
        actionDanger: {
            backgroundColor: COLORS.danger
        },
        actionText: {
            color: COLORS.text,
            fontSize: 13,
            fontWeight: "700"
        },
        section: {
            backgroundColor: COLORS.surface,
            borderRadius: 10,
            overflow: "hidden",
            marginTop: 12
        },
        sectionHeader: {
            minHeight: 50,
            paddingHorizontal: 15,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
        },
        sectionTitle: {
            color: COLORS.text,
            fontSize: 16,
            fontWeight: "700"
        },
        sectionArrow: {
            color: COLORS.muted,
            fontSize: 17
        },
        sectionBody: {
            padding: 14,
            borderTopWidth: 1,
            borderTopColor: COLORS.border
        },
        row: {
            flexDirection: "row",
            paddingVertical: 7
        },
        label: {
            color: COLORS.muted,
            fontSize: 14,
            flex: 1
        },
        value: {
            color: COLORS.text,
            fontSize: 14,
            fontWeight: "600",
            flex: 1.5,
            textAlign: "right"
        },
        roleWrap: {
            flexDirection: "row",
            flexWrap: "wrap"
        },
        role: {
            backgroundColor: COLORS.surface2,
            borderRadius: 6,
            paddingHorizontal: 9,
            paddingVertical: 7,
            marginRight: 7,
            marginBottom: 7
        },
        roleText: {
            color: COLORS.text,
            fontSize: 12,
            fontWeight: "600"
        },
        message: {
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border
        },
        messageDate: {
            color: COLORS.muted,
            fontSize: 11,
            marginBottom: 5
        },
        messageContent: {
            color: COLORS.text,
            fontSize: 14,
            lineHeight: 20
        },
        delete: {
            color: COLORS.danger,
            fontSize: 13,
            fontWeight: "700",
            marginTop: 8
        },
        empty: {
            color: COLORS.muted,
            textAlign: "center",
            paddingVertical: 10,
            lineHeight: 20
        },
        profileModButton: {
            marginTop: 8,
            marginHorizontal: 10,
            minHeight: 42,
            borderRadius: 8,
            backgroundColor: COLORS.surface2,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12
        },
        profileModButtonText: {
            color: COLORS.text,
            fontSize: 14,
            fontWeight: "700"
        }
    });

    const disposers = [];

    function formatDate(value) {
        if (!value) return "Unknown";
        try {
            const d = new Date(value);
            return Number.isNaN(d.getTime()) ? "Unknown" : d.toLocaleString();
        } catch {
            return "Unknown";
        }
    }

    function accountCreated(id) {
        try {
            const ms = Number((BigInt(id) >> 22n)) + 1420070400000;
            return new Date(ms).toLocaleString();
        } catch {
            return "Unknown";
        }
    }

    function displayName(user) {
        return user?.global_name || user?.username || "Unknown User";
    }

    function getAvatar(user) {
        if (!user?.avatar) return null;
        const ext = String(user.avatar).startsWith("a_") ? "gif" : "png";
        return "https://cdn.discordapp.com/avatars/" +
            user.id + "/" + user.avatar + "." + ext + "?size=256";
    }

    function getGuildId(fallback) {
        if (fallback) return fallback;
        try {
            return findByStoreName("SelectedGuildStore")?.getGuildId?.() || null;
        } catch {
            return null;
        }
    }

    function getChannelId() {
        try {
            return findByStoreName("SelectedChannelStore")?.getChannelId?.() || null;
        } catch {
            return null;
        }
    }

    function getRest() {
        try {
            return findByProps(
                "get",
                "post",
                "put",
                "patch",
                "del"
            );
        } catch {
            return null;
        }
    }

    async function request(method, url, body) {
        const rest = getRest();
        if (!rest || typeof rest[method] !== "function") {
            throw new Error("Discord REST API module not found");
        }

        const options = { url: url };
        if (body !== undefined) options.body = body;

        const response = await rest[method](options);
        return response?.body;
    }

    async function fetchMember(guildId, userId) {
        return request(
            "get",
            "/guilds/" + guildId + "/members/" + userId
        );
    }

    async function fetchGuild(guildId) {
        return request("get", "/guilds/" + guildId);
    }

    async function fetchMessages(channelId, userId) {
        const messages = await request(
            "get",
            "/channels/" + channelId + "/messages?limit=100"
        );

        if (!Array.isArray(messages)) return [];

        return messages
            .filter((message) => message?.author?.id === userId)
            .slice(0, 30);
    }

    function confirm(title, message, callback) {
        Alert.alert(
            title,
            message,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Confirm",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await callback();
                        } catch (error) {
                            console.error("[Mobile Mod View]", error);
                            showToast("Action failed");
                        }
                    }
                }
            ]
        );
    }

    async function doTimeout(guildId, userId, minutes) {
        const until = new Date(
            Date.now() + minutes * 60 * 1000
        ).toISOString();

        await request(
            "patch",
            "/guilds/" + guildId + "/members/" + userId,
            {
                communication_disabled_until: until
            }
        );
    }

    async function removeTimeout(guildId, userId) {
        await request(
            "patch",
            "/guilds/" + guildId + "/members/" + userId,
            {
                communication_disabled_until: null
            }
        );
    }

    async function doKick(guildId, userId) {
        await request(
            "del",
            "/guilds/" + guildId + "/members/" + userId
        );
    }

    async function doBan(guildId, userId) {
        await request(
            "put",
            "/guilds/" + guildId + "/bans/" + userId,
            {
                delete_message_seconds: 0
            }
        );
    }

    async function doDeleteMessage(channelId, messageId) {
        await request(
            "del",
            "/channels/" + channelId + "/messages/" + messageId
        );
    }

    function InfoRow({ label, value }) {
        return React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, { style: styles.label }, label),
            React.createElement(
                Text,
                {
                    style: styles.value,
                    numberOfLines: 2
                },
                value == null ? "Unknown" : String(value)
            )
        );
    }

    function Section({ title, defaultOpen, children }) {
        const [open, setOpen] = React.useState(
            defaultOpen !== false
        );

        return React.createElement(
            View,
            { style: styles.section },
            React.createElement(
                Pressable,
                {
                    style: styles.sectionHeader,
                    onPress: () => setOpen(!open)
                },
                React.createElement(
                    Text,
                    { style: styles.sectionTitle },
                    title
                ),
                React.createElement(
                    Text,
                    { style: styles.sectionArrow },
                    open ? "⌃" : "⌄"
                )
            ),
            open
                ? React.createElement(
                      View,
                      { style: styles.sectionBody },
                      children
                  )
                : null
        );
    }

    function ModView({ user, guildId: suppliedGuildId }) {
        const guildId = getGuildId(suppliedGuildId);
        const channelId = getChannelId();

        const [member, setMember] = React.useState(null);
        const [guild, setGuild] = React.useState(null);
        const [messages, setMessages] = React.useState([]);
        const [loading, setLoading] = React.useState(true);
        const [timedOut, setTimedOut] = React.useState(false);
        const [refreshing, setRefreshing] = React.useState(false);

        async function load() {
            setLoading(true);

            try {
                if (guildId) {
                    const results = await Promise.all([
                        fetchMember(guildId, user.id),
                        fetchGuild(guildId)
                    ]);

                    setMember(results[0] || null);
                    setGuild(results[1] || null);
                    setTimedOut(
                        Boolean(
                            results[0]?.communication_disabled_until
                        )
                    );
                }

                if (channelId) {
                    setMessages(
                        await fetchMessages(
                            channelId,
                            user.id
                        )
                    );
                }
            } catch (error) {
                console.error("[Mobile Mod View] load", error);
                showToast("Could not load moderator data");
            } finally {
                setLoading(false);
            }
        }

        React.useEffect(() => {
            load();
        }, [user?.id, guildId, channelId]);

        const roles = Array.isArray(guild?.roles)
            ? guild.roles
            : [];

        const roleMap = {};
        roles.forEach((role) => {
            roleMap[role.id] = role;
        });

        const timeoutLabel = timedOut
            ? formatDate(member?.communication_disabled_until)
            : "None";

        function timeoutPressed() {
            if (!guildId) {
                showToast("No server selected");
                return;
            }

            if (timedOut) {
                confirm(
                    "Remove Timeout",
                    "Remove this user's timeout?",
                    async () => {
                        await removeTimeout(guildId, user.id);
                        setTimedOut(false);
                        showToast("Timeout removed");
                        await load();
                    }
                );
                return;
            }

            Alert.alert(
                "Timeout",
                "Choose a timeout duration.",
                [
                    {
                        text: "10 minutes",
                        onPress: async () => {
                            try {
                                await doTimeout(guildId, user.id, 10);
                                setTimedOut(true);
                                showToast("User timed out");
                                await load();
                            } catch {
                                showToast("Timeout failed");
                            }
                        }
                    },
                    {
                        text: "1 hour",
                        onPress: async () => {
                            try {
                                await doTimeout(guildId, user.id, 60);
                                setTimedOut(true);
                                showToast("User timed out");
                                await load();
                            } catch {
                                showToast("Timeout failed");
                            }
                        }
                    },
                    {
                        text: "1 day",
                        onPress: async () => {
                            try {
                                await doTimeout(guildId, user.id, 1440);
                                setTimedOut(true);
                                showToast("User timed out");
                                await load();
                            } catch {
                                showToast("Timeout failed");
                            }
                        }
                    },
                    {
                        text: "Cancel",
                        style: "cancel"
                    }
                ]
            );
        }

        function kickPressed() {
            if (!guildId) {
                showToast("No server selected");
                return;
            }

            confirm(
                "Kick User",
                "Kick " + displayName(user) + " from this server?",
                async () => {
                    await doKick(guildId, user.id);
                    showToast("User kicked");
                }
            );
        }

        function banPressed() {
            if (!guildId) {
                showToast("No server selected");
                return;
            }

            confirm(
                "Ban User",
                "Ban " + displayName(user) + " from this server?",
                async () => {
                    await doBan(guildId, user.id);
                    showToast("User banned");
                }
            );
        }

        async function refresh() {
            setRefreshing(true);
            await load();
            setRefreshing(false);
        }

        return React.createElement(
            View,
            { style: styles.root },
            React.createElement(
                ScrollView,
                {
                    contentContainerStyle: styles.content,
                    refreshControl: RN.RefreshControl
                        ? React.createElement(
                              RN.RefreshControl,
                              {
                                  refreshing: refreshing,
                                  onRefresh: refresh
                              }
                          )
                        : undefined
                },

                React.createElement(
                    View,
                    { style: styles.header },

                    getAvatar(user)
                        ? React.createElement(Image, {
                              source: {
                                  uri: getAvatar(user)
                              },
                              style: styles.avatar
                          })
                        : React.createElement(
                              View,
                              { style: styles.avatar }
                          ),

                    React.createElement(
                        Text,
                        { style: styles.name },
                        displayName(user)
                    ),

                    React.createElement(
                        Text,
                        { style: styles.tag },
                        user?.username
                            ? "@" + user.username
                            : "Unknown"
                    ),

                    user?.bot
                        ? React.createElement(
                              View,
                              { style: styles.botBadge },
                              React.createElement(
                                  Text,
                                  { style: styles.botText },
                                  "BOT"
                              )
                          )
                        : null
                ),

                guildId
                    ? React.createElement(
                          View,
                          { style: styles.actionRow },

                          React.createElement(
                              Pressable,
                              {
                                  style: [
                                      styles.action,
                                      timedOut
                                          ? styles.actionWarning
                                          : null
                                  ],
                                  onPress: timeoutPressed
                              },
                              React.createElement(
                                  Text,
                                  { style: styles.actionText },
                                  timedOut
                                      ? "Remove Timeout"
                                      : "Timeout"
                              )
                          ),

                          React.createElement(
                              Pressable,
                              {
                                  style: styles.action,
                                  onPress: kickPressed
                              },
                              React.createElement(
                                  Text,
                                  { style: styles.actionText },
                                  "Kick"
                              )
                          ),

                          React.createElement(
                              Pressable,
                              {
                                  style: [
                                      styles.action,
                                      styles.actionDanger
                                  ],
                                  onPress: banPressed
                              },
                              React.createElement(
                                  Text,
                                  { style: styles.actionText },
                                  "Ban"
                              )
                          )
                      )
                    : null,

                React.createElement(
                    Section,
                    { title: "User Information" },

                    React.createElement(InfoRow, {
                        label: "User ID",
                        value: user?.id
                    }),

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
                        label: "Account Created",
                        value: accountCreated(user?.id)
                    }),

                    React.createElement(InfoRow, {
                        label: "Bot",
                        value: user?.bot ? "Yes" : "No"
                    }),

                    React.createElement(InfoRow, {
                        label: "Nickname",
                        value: member?.nick || "None"
                    })
                ),

                React.createElement(
                    Section,
                    {
                        title:
                            "Server Information"
                    },

                    React.createElement(InfoRow, {
                        label: "Server",
                        value: guild?.name
                    }),

                    React.createElement(InfoRow, {
                        label: "Server ID",
                        value: guildId
                    }),

                    React.createElement(InfoRow, {
                        label: "Joined Server",
                        value: formatDate(
                            member?.joined_at
                        )
                    }),

                    React.createElement(InfoRow, {
                        label: "Timeout",
                        value: timeoutLabel
                    })
                ),

                React.createElement(
                    Section,
                    {
                        title:
                            "Roles (" +
                            (member?.roles?.length || 0) +
                            ")"
                    },

                    member?.roles?.length
                        ? React.createElement(
                              View,
                              {
                                  style:
                                      styles.roleWrap
                              },
                              member.roles.map(
                                  (roleId) => {
                                      const role =
                                          roleMap[
                                              roleId
                                          ];

                                      return role
                                          ? React.createElement(
                                                View,
                                                {
                                                    key:
                                                        role.id,
                                                    style:
                                                        styles.role
                                                },
                                                React.createElement(
                                                    Text,
                                                    {
                                                        style:
                                                            styles.roleText
                                                    },
                                                    role.name
                                                )
                                            )
                                          : null;
                                  }
                              )
                          )
                        : React.createElement(
                              Text,
                              {
                                  style:
                                      styles.empty
                              },
                              "No roles found."
                          )
                ),

                React.createElement(
                    Section,
                    {
                        title:
                            "Recent Messages (" +
                            messages.length +
                            ")"
                    },

                    messages.length
                        ? messages.map(
                              (message) =>
                                  React.createElement(
                                      View,
                                      {
                                          key:
                                              message.id,
                                          style:
                                              styles.message
                                      },

                                      React.createElement(
                                          Text,
                                          {
                                              style:
                                                  styles.messageDate
                                          },
                                          formatDate(
                                              message.timestamp
                                          )
                                      ),

                                      React.createElement(
                                          Text,
                                          {
                                              style:
                                                  styles.messageContent
                                          },
                                          message.content ||
                                              "[Attachment / no text]"
                                      ),

                                      React.createElement(
                                          Pressable,
                                          {
                                              onPress:
                                                  () =>
                                                      confirm(
                                                          "Delete Message",
                                                          "Delete this message?",
                                                          async () => {
                                                              await doDeleteMessage(
                                                                  message.channel_id,
                                                                  message.id
                                                              );

                                                              setMessages(
                                                                  (
                                                                      old
                                                                  ) =>
                                                                      old.filter(
                                                                          (
                                                                              item
                                                                          ) =>
                                                                              item.id !==
                                                                              message.id
                                                                      )
                                                              );

                                                              showToast(
                                                                  "Message deleted"
                                                              );
                                                          }
                                                      )
                                          },

                                          React.createElement(
                                              Text,
                                              {
                                                  style:
                                                      styles.delete
                                              },
                                              "Delete Message"
                                          )
                                      )
                                  )
                          )
                        : React.createElement(
                              Text,
                              {
                                  style:
                                      styles.empty
                              },
                              channelId
                                  ? "No recent messages from this user in the current channel."
                                  : "Open a server channel to load recent messages."
                          )
                ),

                React.createElement(
                    Section,
                    {
                        title:
                            "Moderation Status",
                        defaultOpen:
                            false
                    },

                    React.createElement(InfoRow, {
                        label: "Member fetched",
                        value: member
                            ? "Yes"
                            : "No"
                    }),

                    React.createElement(InfoRow, {
                        label: "Role data",
                        value:
                            guild?.roles
                                ? "Available"
                                : "Unavailable"
                    }),

                    React.createElement(InfoRow, {
                        label: "Message channel",
                        value:
                            channelId || "Unavailable"
                    })
                ),

                loading
                    ? React.createElement(
                          Text,
                          {
                              style:
                                  styles.empty
                          },
                          "Loading moderator data..."
                      )
                    : null
            )
        );
    }

    function openModView(user, guildId) {
        try {
            showCustomAlert(
                ModView,
                {
                    user: user,
                    guildId: guildId
                }
            );
        } catch (error) {
            console.error(
                "[Mobile Mod View] modal",
                error
            );
            showToast(
                "Unable to open Mod View"
            );
        }
    }

    function patchHeaderAvatar() {
        const HeaderAvatar =
            findByName(
                "HeaderAvatar",
                false
            );

        if (!HeaderAvatar) {
            return false;
        }

        const unpatch =
            after(
                "default",
                HeaderAvatar,
                (args, result) => {
                    const props =
                        args?.[0];

                    const user =
                        props?.user;

                    if (
                        !user ||
                        !user.id ||
                        !result
                    ) {
                        return result;
                    }

                    return React.createElement(
                        View,
                        {
                            style: {
                                alignItems:
                                    "center"
                            }
                        },

                        result,

                        React.createElement(
                            Pressable,
                            {
                                style:
                                    styles.profileModButton,

                                onPress:
                                    () =>
                                        openModView(
                                            user,
                                            props?.guildId
                                        ),

                                accessibilityRole:
                                    "button",

                                accessibilityLabel:
                                    "Mod View"
                            },

                            React.createElement(
                                Text,
                                {
                                    style:
                                        styles.profileModButtonText
                                },
                                "🛡️ Mod View"
                            )
                        )
                    );
                }
            );

        disposers.push(
            unpatch
        );

        return true;
    }

    function start() {
        try {
            if (
                patchHeaderAvatar()
            ) {
                showToast(
                    "Mobile Mod View enabled"
                );
            } else {
                showToast(
                    "Mod View: profile component not found"
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
        while (
            disposers.length
        ) {
            try {
                disposers.pop()();
            } catch {}
        }
    }

    p.default = {
        onLoad: start,
        onUnload: stop
    };

    Object.defineProperty(
        p,
        "__esModule",
        {
            value: true
        }
    );

    return p;
})
({}, vendetta.metro, vendetta.patcher, vendetta.common, vendetta.ui)
