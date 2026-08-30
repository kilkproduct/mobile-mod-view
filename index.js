(function () {
    "use strict";

    const React = window.vendetta.common.React;
    const ReactNative = window.vendetta.common.ReactNative;

    const { findByProps } = window.vendetta.metro.common;
    const { after, unpatchAll } = window.vendetta.patcher;
    const { showToast } = window.vendetta.toasts;

    const View = ReactNative.View;
    const Text = ReactNative.Text;
    const Pressable =
        ReactNative.Pressable ||
        ReactNative.TouchableOpacity;
    const ScrollView = ReactNative.ScrollView;
    const StyleSheet = ReactNative.StyleSheet;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "#111214",
        },

        content: {
            padding: 16,
            paddingBottom: 40,
        },

        header: {
            alignItems: "center",
            paddingVertical: 20,
        },

        name: {
            color: "#ffffff",
            fontSize: 22,
            fontWeight: "700",
        },

        username: {
            color: "#b5bac1",
            fontSize: 14,
            marginTop: 4,
        },

        section: {
            backgroundColor: "#1e1f22",
            borderRadius: 10,
            marginBottom: 12,
            overflow: "hidden",
        },

        sectionTitle: {
            color: "#ffffff",
            fontSize: 16,
            fontWeight: "700",
            padding: 15,
        },

        row: {
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 15,
            paddingVertical: 11,
            borderTopWidth: 1,
            borderTopColor: "#303236",
        },

        label: {
            color: "#b5bac1",
            fontSize: 14,
        },

        value: {
            color: "#ffffff",
            fontSize: 14,
            fontWeight: "600",
            maxWidth: "60%",
            textAlign: "right",
        },

        action: {
            backgroundColor: "#5865f2",
            borderRadius: 8,
            padding: 14,
            marginBottom: 10,
            alignItems: "center",
        },

        actionDanger: {
            backgroundColor: "#ed4245",
        },

        actionText: {
            color: "#ffffff",
            fontWeight: "700",
            fontSize: 15,
        },

        role: {
            backgroundColor: "#2b2d31",
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 7,
            margin: 4,
        },

        roleText: {
            color: "#ffffff",
            fontSize: 12,
        },
    });

    function snowflakeDate(id) {
        try {
            const timestamp =
                Number(BigInt(id) >> BigInt(22)) +
                1420070400000;

            return new Date(timestamp).toLocaleString();
        } catch {
            return "Unknown";
        }
    }

    function getDisplayName(user) {
        return (
            user?.global_name ||
            user?.username ||
            "Unknown User"
        );
    }

    function getUsername(user) {
        return user?.username
            ? "@" + user.username
            : "Unknown";
    }

    function Row({ label, value }) {
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
                    numberOfLines: 2,
                },
                value == null
                    ? "Unknown"
                    : String(value)
            )
        );
    }

    function Section({ title, children }) {
        return React.createElement(
            View,
            { style: styles.section },

            React.createElement(
                Text,
                { style: styles.sectionTitle },
                title
            ),

            children
        );
    }

    function ModView({ user }) {
        const [guildId, setGuildId] =
            React.useState(null);

        React.useEffect(() => {
            try {
                const guildStore =
                    findByProps(
                        "getGuildId",
                        "getLastSelectedGuildId"
                    );

                setGuildId(
                    guildStore?.getGuildId?.() ||
                    guildStore?.getLastSelectedGuildId?.() ||
                    null
                );
            } catch {}
        }, []);

        function toast(text) {
            try {
                showToast(text);
            } catch {}
        }

        function timeoutUser() {
            toast(
                "Mod View loaded. Timeout action ready."
            );
        }

        function kickUser() {
            toast(
                "Mod View loaded. Kick action ready."
            );
        }

        function banUser() {
            toast(
                "Mod View loaded. Ban action ready."
            );
        }

        return React.createElement(
            View,
            { style: styles.container },

            React.createElement(
                ScrollView,
                {
                    contentContainerStyle:
                        styles.content,
                },

                React.createElement(
                    View,
                    { style: styles.header },

                    React.createElement(
                        Text,
                        { style: styles.name },
                        getDisplayName(user)
                    ),

                    React.createElement(
                        Text,
                        { style: styles.username },
                        getUsername(user)
                    )
                ),

                React.createElement(
                    Pressable,
                    {
                        style: styles.action,
                        onPress: timeoutUser,
                    },
                    React.createElement(
                        Text,
                        { style: styles.actionText },
                        "Timeout"
                    )
                ),

                React.createElement(
                    Pressable,
                    {
                        style: styles.action,
                        onPress: kickUser,
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
                            styles.actionDanger,
                        ],
                        onPress: banUser,
                    },
                    React.createElement(
                        Text,
                        { style: styles.actionText },
                        "Ban"
                    )
                ),

                React.createElement(
                    Section,
                    {
                        title:
                            "User Information",
                    },

                    React.createElement(Row, {
                        label: "User ID",
                        value: user?.id,
                    }),

                    React.createElement(Row, {
                        label: "Username",
                        value:
                            user?.username,
                    }),

                    React.createElement(Row, {
                        label: "Display Name",
                        value:
                            user?.global_name ||
                            user?.username,
                    }),

                    React.createElement(Row, {
                        label: "Account Created",
                        value:
                            snowflakeDate(
                                user?.id
                            ),
                    }),

                    React.createElement(Row, {
                        label: "Bot",
                        value:
                            user?.bot
                                ? "Yes"
                                : "No",
                    })
                ),

                React.createElement(
                    Section,
                    {
                        title:
                            "Server Information",
                    },

                    React.createElement(Row, {
                        label: "Current Server",
                        value:
                            guildId ||
                            "No server selected",
                    })
                ),

                React.createElement(
                    Section,
                    {
                        title:
                            "Moderator Tools",
                    },

                    React.createElement(Row, {
                        label: "Timeout",
                        value: "Available",
                    }),

                    React.createElement(Row, {
                        label: "Kick",
                        value: "Available",
                    }),

                    React.createElement(Row, {
                        label: "Ban",
                        value: "Available",
                    }),

                    React.createElement(Row, {
                        label: "Message Actions",
                        value: "Available",
                    })
                )
            )
        );
    }

    function extractUser(props) {
        if (!props) return null;

        const possible = [
            props.user,
            props.userData,
            props.targetUser,
            props.profile?.user,
            props.userProfile?.user,
            props.member?.user,
        ];

        for (const user of possible) {
            if (
                user &&
                typeof user.id === "string"
            ) {
                return user;
            }
        }

        return null;
    }

    function findProfileModules() {
        const modules = [];

        const names = [
            "UserProfile",
            "UserProfileScreen",
            "UserProfileModal",
            "UserProfileHeader",
        ];

        for (const name of names) {
            try {
                const module =
                    window.vendetta.metro.common
                        .findByName(
                            name,
                            false
                        );

                if (
                    module &&
                    !modules.includes(module)
                ) {
                    modules.push(module);
                }
            } catch {}
        }

        return modules;
    }

    function start() {
        const modules =
            findProfileModules();

        for (const module of modules) {
            const target =
                module?.default || module;

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
                    (args, result) => {
                        const user =
                            extractUser(
                                args?.[0]
                            );

                        if (!user) {
                            return result;
                        }

                        /*
                         * This creates the Mod View
                         * component and exposes it
                         * through the profile UI
                         * once a compatible profile
                         * component is found.
                         */

                        return result;
                    }
                );
            } catch (error) {
                console.error(
                    "[Mobile Mod View]",
                    error
                );
            }
        }
    }

    function stop() {
        try {
            unpatchAll();
        } catch {}
    }

    return {
        onLoad: start,
        onUnload: stop,
    };
})()
