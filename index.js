(function (p, m, q, c, ui) {
    "use strict";

    // Bunny still supports the legacy Vendetta plugin API.
    // Keep all potentially fragile API lookups lazy so a missing Discord
    // module cannot prevent the plugin from loading.

    const React = c?.React || null;
    const RN = c?.ReactNative || null;

    const metro = m || {};
    const patcher = q || {};
    const userInterface = ui || {};

    const findByName = metro.findByName;
    const findByProps = metro.findByProps;
    const findByStoreName = metro.findByStoreName;

    const after = patcher.after;

    const toast =
        typeof userInterface?.toasts?.showToast === "function"
            ? userInterface.toasts.showToast
            : null;

    if (!React || !RN) {
        console.error("[Mobile Mod View] React API unavailable");
    }

    const View = RN?.View;
    const Text = RN?.Text;
    const Pressable = RN?.Pressable || RN?.TouchableOpacity;
    const ScrollView = RN?.ScrollView;
    const Image = RN?.Image;
    const Modal = RN?.Modal;
    const StyleSheet = RN?.StyleSheet;
    const ActivityIndicator = RN?.ActivityIndicator;

    const disposers = [];

    const styles = StyleSheet?.create?.({
        modalRoot: {
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.55)"
        },
        modalCard: {
            marginHorizontal: 14,
            maxHeight: "88%",
            backgroundColor: "#111214",
            borderRadius: 14,
            overflow: "hidden"
        },
        modalHeader: {
            minHeight: 54,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: "#3f4147"
        },
        modalTitle: {
            flex: 1,
            color: "#f2f3f5",
            fontSize: 18,
            fontWeight: "700"
        },
        closeText: {
            color: "#b5bac1",
            fontSize: 14,
            fontWeight: "700",
            paddingLeft: 12
        },
        content: {
            padding: 15,
            paddingBottom: 28
        },
        header: {
            alignItems: "center",
            paddingVertical: 8
        },
        avatar: {
            width: 78,
            height: 78,
            borderRadius: 39,
            backgroundColor: "#2b2d31",
            marginBottom: 9
        },
        name: {
            color: "#f2f3f5",
            fontSize: 20,
            fontWeight: "700"
        },
        username: {
            color: "#b5bac1",
            fontSize: 14,
            marginTop: 3
        },
        section: {
            marginTop: 11,
            backgroundColor: "#1e1f22",
            borderRadius: 10,
            overflow: "hidden"
        },
        sectionHeader: {
            minHeight: 48,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
        },
        sectionTitle: {
            color: "#f2f3f5",
            fontSize: 15,
            fontWeight: "700"
        },
        sectionArrow: {
            color: "#b5bac1",
            fontSize: 17
        },
        sectionBody: {
            padding: 13,
            borderTopWidth: 1,
            borderTopColor: "#3f4147"
        },
        row: {
            flexDirection: "row",
            paddingVertical: 6
        },
        label: {
            flex: 1,
            color: "#b5bac1",
            fontSize: 13
        },
        value: {
            flex: 1.7,
            color: "#f2f3f5",
            fontSize: 13,
            fontWeight: "600",
            textAlign: "right"
        },
        roleWrap: {
            flexDirection: "row",
            flexWrap: "wrap"
        },
        role: {
            backgroundColor: "#2b2d31",
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 6,
            marginRight: 6,
            marginBottom: 6
        },
        roleText: {
            color: "#f2f3f5",
            fontSize: 12,
            fontWeight: "600"
        },
        message: {
            paddingVertical: 9,
            borderBottomWidth: 1,
            borderBottomColor: "#3f4147"
        },
        messageDate: {
            color: "#b5bac1",
            fontSize: 10,
            marginBottom: 4
        },
        messageText: {
            color: "#f2f3f5",
            fontSize: 13,
            lineHeight: 19
        },
        empty: {
            color: "#b5bac1",
            textAlign: "center",
            paddingVertical: 10,
            lineHeight: 19
        },
        loading: {
            alignItems: "center",
            paddingVertical: 15
        },
        profileButton: {
            marginTop: 8,
            marginHorizontal: 10,
            minHeight: 40,
            borderRadius: 8,
            backgroundColor: "#2b2d31",
            borderWidth: 1,
            borderColor: "#3f4147",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12
        },
        profileButtonText: {
            color: "#f2f3f5",
            fontSize: 14,
            fontWeight: "700"
        },
        refresh: {
            marginTop: 12,
            minHeight: 42,
            borderRadius: 8,
            backgroundColor: "#2b2d31",
            alignItems: "center",
            justifyContent: "center"
        },
        refreshText: {
            color: "#f2f3f5",
            fontSize: 14,
            fontWeight: "700"
        }
    });

    function showToast(message) {
        try {
            if (toast) {
                toast(message);
            } else {
                console.log("[Mobile Mod View]", message);
            }
        } catch (error) {
            console.error("[Mobile Mod View] toast", error);
        }
    }

    function safeName(user) {
        return (
            user?.global_name ||
            user?.username ||
            "Unknown User"
        );
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

    function accountCreated(id) {
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

    function avatarUrl(user) {
        if (!user?.id || !user?.avatar) return null;

        const hash = String(user.avatar);
        const extension = hash.startsWith("a_")
            ? "gif"
            : "png";

        return (
            "https://cdn.discordapp.com/avatars/" +
            user.id +
            "/" +
            hash +
            "." +
            extension +
            "?size=256"
        );
    }

    function getGuildId(providedGuildId) {
        if (providedGuildId) return providedGuildId;

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
                ) ||
                findByProps("get")
            );
        } catch (error) {
            console.error("[Mobile Mod View] REST lookup", error);
            return null;
        }
    }

    async function restGet(url) {
        const rest = getRest();

        if (
            !rest ||
            typeof rest.get !== "function"
        ) {
            throw new Error("Discord REST API unavailable");
        }

        const response =
            await rest.get({ url: url });

        return response?.body;
    }

    async function fetchMember(guildId, userId) {
        if (!guildId || !userId) return null;

        return restGet(
            "/guilds/" +
                guildId +
                "/members/" +
                userId
        );
    }

    async function fetchGuild(guildId) {
        if (!guildId) return null;
        return restGet("/guilds/" + guildId);
    }

    async function fetchMessages(channelId, userId) {
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
            .slice(0, 30);
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
                    ? "Unknown"
                    : String(value)
            )
        );
    }

    function Section({
        title,
        children,
        defaultOpen = true
    }) {
        const [open, setOpen] =
            React.useState(defaultOpen);

        return React.createElement(
            View,
            { style: styles.section },
            React.createElement(
                Pressable,
                {
                    style: styles.sectionHeader,
                    onPress: () =>
                        setOpen(current => !current)
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

    function ModView({ user, guildId: suppliedGuildId, onClose }) {
        const guildId = getGuildId(suppliedGuildId);
        const channelId = getChannelId();

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
                        await Promise.allSettled([
                            fetchMember(
                                guildId,
                                user?.id
                            ),
                            fetchGuild(guildId)
                        ]);

                    if (
                        results[0]?.status === "fulfilled"
                    ) {
                        setMember(
                            results[0].value || null
                        );
                    }

                    if (
                        results[1]?.status === "fulfilled"
                    ) {
                        setGuild(
                            results[1].value || null
                        );
                    }
                }

                if (channelId && user?.id) {
                    try {
                        setMessages(
                            await fetchMessages(
                                channelId,
                                user.id
                            )
                        );
                    } catch (error) {
                        console.error(
                            "[Mobile Mod View] messages",
                            error
                        );
                        setMessages([]);
                    }
                }
            } catch (error) {
                console.error(
                    "[Mobile Mod View] load",
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

        const roles =
            Array.isArray(guild?.roles)
                ? guild.roles
                : [];

        const roleMap = {};

        roles.forEach(role => {
            if (role?.id) {
                roleMap[role.id] = role;
            }
        });

        const memberRoles =
            Array.isArray(member?.roles)
                ? member.roles
                : [];

        const avatar = avatarUrl(user);

        async function refresh() {
            if (refreshing) return;

            setRefreshing(true);
            await load();
            setRefreshing(false);
        }

        return React.createElement(
            View,
            { style: styles.modalRoot },

            React.createElement(
                View,
                { style: styles.modalCard },

                React.createElement(
                    View,
                    { style: styles.modalHeader },

                    React.createElement(
                        Text,
                        {
                            style: styles.modalTitle,
                            numberOfLines: 1
                        },
                        "Mobile Mod View"
                    ),

                    React.createElement(
                        Pressable,
                        {
                            onPress: onClose,
                            accessibilityRole: "button",
                            accessibilityLabel:
                                "Close Mod View"
                        },
                        React.createElement(
                            Text,
                            { style: styles.closeText },
                            "Close"
                        )
                    )
                ),

                React.createElement(
                    ScrollView,
                    {
                        contentContainerStyle:
                            styles.content
                    },

                    React.createElement(
                        View,
                        { style: styles.header },

                        avatar
                            ? React.createElement(
                                  Image,
                                  {
                                      source: {
                                          uri: avatar
                                      },
                                      style: styles.avatar
                                  }
                              )
                            : React.createElement(
                                  View,
                                  {
                                      style: styles.avatar
                                  }
                              ),

                        React.createElement(
                            Text,
                            { style: styles.name },
                            safeName(user)
                        ),

                        React.createElement(
                            Text,
                            { style: styles.username },
                            user?.username
                                ? "@" + user.username
                                : "Unknown"
                        )
                    ),

                    React.createElement(
                        Section,
                        {
                            title: "User Information"
                        },

                        React.createElement(
                            InfoRow,
                            {
                                label: "User ID",
                                value: user?.id
                            }
                        ),

                        React.createElement(
                            InfoRow,
                            {
                                label: "Username",
                                value: user?.username
                            }
                        ),

                        React.createElement(
                            InfoRow,
                            {
                                label: "Display Name",
                                value:
                                    user?.global_name ||
                                    user?.username
                            }
                        ),

                        React.createElement(
                            InfoRow,
                            {
                                label: "Account Created",
                                value:
                                    accountCreated(
                                        user?.id
                                    )
                            }
                        ),

                        React.createElement(
                            InfoRow,
                            {
                                label: "Bot",
                                value: user?.bot
                                    ? "Yes"
                                    : "No"
                            }
                        ),

                        React.createElement(
                            InfoRow,
                            {
                                label: "System Account",
                                value: user?.system
                                    ? "Yes"
                                    : "No"
                            }
                        )
                    ),

                    React.createElement(
                        Section,
                        {
                            title: "Server Information"
                        },

                        React.createElement(
                            InfoRow,
                            {
                                label: "Server",
                                value: guild?.name
                            }
                        ),

                        React.createElement(
                            InfoRow,
                            {
                                label: "Server ID",
                                value: guildId
                            }
                        ),

                        React.createElement(
                            InfoRow,
                            {
                                label: "Nickname",
                                value:
                                    member?.nick ||
                                    "None"
                            }
                        ),

                        React.createElement(
                            InfoRow,
                            {
                                label: "Joined Server",
                                value:
                                    formatDate(
                                        member?.joined_at
                                    )
                            }
                        )
                    ),

                    React.createElement(
                        Section,
                        {
                            title:
                                "Roles (" +
                                memberRoles.length +
                                ")"
                        },

                        memberRoles.length
                            ? React.createElement(
                                  View,
                                  {
                                      style:
                                          styles.roleWrap
                                  },

                                  memberRoles.map(
                                      roleId => {
                                          const role =
                                              roleMap[
                                                  roleId
                                              ];

                                          if (!role) {
                                              return null;
                                          }

                                          return React.createElement(
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
                                          );
                                      }
                                  )
                              )
                            : React.createElement(
                                  Text,
                                  {
                                      style:
                                          styles.empty
                                  },
                                  guildId
                                      ? "No roles available."
                                      : "No server selected."
                              )
                    ),

                    React.createElement(
                        Section,
                        {
                            title:
                                "Recent Messages (" +
                                messages.length +
                                ")",
                            defaultOpen: false
                        },

                        messages.length
                            ? messages.map(
                                  message =>
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
                                                      styles.messageText
                                              },
                                              message.content ||
                                                  "[No text / attachment]"
                                          )
                                      )
                              )
                            : React.createElement(
                                  Text,
                                  {
                                      style: styles.empty
                                  },
                                  channelId
                                      ? "No recent messages found."
                                      : "No channel selected."
                              )
                    ),

                    React.createElement(
                        Section,
                        {
                            title: "Status",
                            defaultOpen: false
                        },

                        React.createElement(
                            InfoRow,
                            {
                                label: "Member data",
                                value:
                                    member
                                        ? "Loaded"
                                        : "Unavailable"
                            }
                        ),

                        React.createElement(
                            InfoRow,
                            {
                                label: "Server data",
                                value:
                                    guild
                                        ? "Loaded"
                                        : "Unavailable"
                            }
                        ),

                        React.createElement(
                            InfoRow,
                            {
                                label: "Message data",
                                value:
                                    messages.length
                                        ? "Loaded"
                                        : "Unavailable"
                            }
                        )
                    ),

                    loading
                        ? React.createElement(
                              View,
                              {
                                  style:
                                      styles.loading
                              },

                              ActivityIndicator
                                  ? React.createElement(
                                        ActivityIndicator
                                    )
                                  : null,

                              React.createElement(
                                  Text,
                                  {
                                      style:
                                          styles.empty
                                  },
                                  "Loading information..."
                              )
                          )
                        : null,

                    React.createElement(
                        Pressable,
                        {
                            style: styles.refresh,
                            onPress: refresh,
                            disabled: refreshing
                        },

                        React.createElement(
                            Text,
                            {
                                style:
                                    styles.refreshText
                            },
                            refreshing
                                ? "Refreshing..."
                                : "Refresh"
                        )
                    )
                )
            )
        );
    }

    function ModButton({ user, guildId }) {
        const [visible, setVisible] =
            React.useState(false);

        return React.createElement(
            View,
            {
                style: {
                    alignItems: "center",
                    width: "100%"
                }
            },

            React.createElement(
                Pressable,
                {
                    style: styles.profileButton,
                    onPress: () =>
                        setVisible(true),
                    accessibilityRole: "button",
                    accessibilityLabel:
                        "Open Mobile Mod View"
                },

                React.createElement(
                    Text,
                    {
                        style:
                            styles.profileButtonText
                    },
                    "🛡️ Mod View"
                )
            ),

            Modal
                ? React.createElement(
                      Modal,
                      {
                          visible: visible,
                          transparent: true,
                          animationType: "fade",
                          onRequestClose: () =>
                              setVisible(false)
                      },

                      React.createElement(
                          ModView,
                          {
                              user: user,
                              guildId: guildId,
                              onClose: () =>
                                  setVisible(false)
                          }
                      )
                  )
                : null
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
            HeaderAvatar =
                findByName(
                    "HeaderAvatar",
                    false
                );
        } catch (error) {
            console.error(
                "[Mobile Mod View] HeaderAvatar lookup",
                error
            );
        }

        if (!HeaderAvatar) {
            return false;
        }

        try {
            const unpatch = after(
                "default",
                HeaderAvatar,
                (args, result) => {
                    try {
                        const props = args?.[0];
                        const user = props?.user;

                        if (
                            !user?.id ||
                            !result
                        ) {
                            return result;
                        }

                        return React.createElement(
                            View,
                            {
                                style: {
                                    alignItems:
                                        "center",
                                    width: "100%"
                                }
                            },

                            result,

                            React.createElement(
                                ModButton,
                                {
                                    user: user,
                                    guildId:
                                        props?.guildId
                                }
                            )
                        );
                    } catch (error) {
                        console.error(
                            "[Mobile Mod View] render patch",
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
                showToast(
                    "Mobile Mod View: React API unavailable"
                );
                return;
            }

            if (patchHeaderAvatar()) {
                showToast(
                    "Mobile Mod View enabled"
                );
            } else {
                showToast(
                    "Mobile Mod View: profile component not found"
                );
            }
        } catch (error) {
            console.error(
                "[Mobile Mod View] start",
                error
            );

            showToast(
                "Mobile Mod View failed to start"
            );
        }
    }

    function stop() {
        while (disposers.length) {
            try {
                const dispose =
                    disposers.pop();

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

    Object.defineProperty(
        p,
        "__esModule",
        {
            value: true
        }
    );

    return p;
})(
    {},
    vendetta.metro,
    vendetta.patcher,
    vendetta.common,
    vendetta.ui
);
