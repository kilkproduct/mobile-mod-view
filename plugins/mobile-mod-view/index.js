(function(vendetta) {
    const {
        React,
        ReactNative
    } = vendetta.common;

    const {
        View,
        Text,
        ScrollView,
        Pressable,
        StyleSheet
    } = ReactNative;

    const {
        findByProps
    } = vendetta.metro;

    const {
        showToast
    } = vendetta.toasts;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "#111214"
        },

        content: {
            padding: 16,
            paddingBottom: 40
        },

        header: {
            alignItems: "center",
            paddingTop: 10,
            paddingBottom: 20
        },

        avatar: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "#5865f2",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12
        },

        avatarText: {
            color: "#ffffff",
            fontSize: 30,
            fontWeight: "700"
        },

        name: {
            color: "#ffffff",
            fontSize: 21,
            fontWeight: "700"
        },

        username: {
            color: "#b5bac1",
            fontSize: 14,
            marginTop: 3
        },

        section: {
            backgroundColor: "#1e1f22",
            borderRadius: 12,
            marginBottom: 12,
            overflow: "hidden"
        },

        sectionTitle: {
            color: "#ffffff",
            fontSize: 16,
            fontWeight: "700",
            padding: 15
        },

        row: {
            minHeight: 45,
            paddingHorizontal: 15,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderTopWidth: 1,
            borderTopColor: "#303236"
        },

        label: {
            color: "#b5bac1",
            fontSize: 14,
            flex: 1
        },

        value: {
            color: "#ffffff",
            fontSize: 14,
            fontWeight: "600",
            maxWidth: "60%",
            textAlign: "right"
        },

        action: {
            backgroundColor: "#5865f2",
            borderRadius: 9,
            paddingVertical: 13,
            paddingHorizontal: 16,
            marginBottom: 9,
            alignItems: "center"
        },

        actionDanger: {
            backgroundColor: "#ed4245"
        },

        actionWarning: {
            backgroundColor: "#f0b232"
        },

        actionText: {
            color: "#ffffff",
            fontSize: 15,
            fontWeight: "700"
        },

        muted: {
            color: "#949ba4",
            fontSize: 13,
            padding: 15
        }
    });

    function accountDate(id) {
        try {
            const timestamp =
                Number(BigInt(id) >> 22n) +
                1420070400000;

            return new Date(timestamp).toLocaleString();
        } catch {
            return "Unknown";
        }
    }

    function initials(user) {
        const text =
            user.global_name ||
            user.username ||
            "?";

        return text
            .slice(0, 2)
            .toUpperCase();
    }

    function Row({ label, value }) {
        return React.createElement(
            View,
            {
                style: styles.row
            },

            React.createElement(
                Text,
                {
                    style: styles.label
                },
                label
            ),

            React.createElement(
                Text,
                {
                    style: styles.value,
                    numberOfLines: 2
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
            {
                style: styles.section
            },

            React.createElement(
                Text,
                {
                    style: styles.sectionTitle
                },
                title
            ),

            children
        );
    }

    function ActionButton({
        text,
        danger,
        warning,
        onPress
    }) {
        const buttonStyle = [
            styles.action,
            danger && styles.actionDanger,
            warning && styles.actionWarning
        ];

        return React.createElement(
            Pressable,
            {
                style: buttonStyle,
                onPress
            },

            React.createElement(
                Text,
                {
                    style: styles.actionText
                },
                text
            )
        );
    }

    function ModView({ user }) {
        const safeUser = user || {};

        const displayName =
            safeUser.global_name ||
            safeUser.username ||
            "Unknown User";

        const username =
            safeUser.username
                ? "@" + safeUser.username
                : "Unknown";

        function notImplemented(action) {
            showToast(
                action +
                " requires Discord's moderator API."
            );
        }

        return React.createElement(
            View,
            {
                style: styles.container
            },

            React.createElement(
                ScrollView,
                {
                    contentContainerStyle:
                        styles.content
                },

                React.createElement(
                    View,
                    {
                        style: styles.header
                    },

                    React.createElement(
                        View,
                        {
                            style: styles.avatar
                        },

                        React.createElement(
                            Text,
                            {
                                style: styles.avatarText
                            },
                            initials(safeUser)
                        )
                    ),

                    React.createElement(
                        Text,
                        {
                            style: styles.name
                        },
                        displayName
                    ),

                    React.createElement(
                        Text,
                        {
                            style: styles.username
                        },
                        username
                    )
                ),

                React.createElement(
                    ActionButton,
                    {
                        text: "Timeout",
                        warning: true,
                        onPress: () =>
                            notImplemented("Timeout")
                    }
                ),

                React.createElement(
                    ActionButton,
                    {
                        text: "Kick",
                        onPress: () =>
                            notImplemented("Kick")
                    }
                ),

                React.createElement(
                    ActionButton,
                    {
                        text: "Ban",
                        danger: true,
                        onPress: () =>
                            notImplemented("Ban")
                    }
                ),

                React.createElement(
                    Section,
                    {
                        title: "User Information"
                    },

                    React.createElement(
                        Row,
                        {
                            label: "User ID",
                            value: safeUser.id
                        }
                    ),

                    React.createElement(
                        Row,
                        {
                            label: "Username",
                            value: safeUser.username
                        }
                    ),

                    React.createElement(
                        Row,
                        {
                            label: "Display Name",
                            value:
                                safeUser.global_name ||
                                safeUser.username
                        }
                    ),

                    React.createElement(
                        Row,
                        {
                            label: "Account Created",
                            value:
                                accountDate(
                                    safeUser.id
                                )
                        }
                    ),

                    React.createElement(
                        Row,
                        {
                            label: "Bot",
                            value:
                                safeUser.bot
                                    ? "Yes"
                                    : "No"
                        }
                    )
                ),

                React.createElement(
                    Section,
                    {
                        title: "Moderator Information"
                    },

                    React.createElement(
                        Row,
                        {
                            label: "Timeout",
                            value: "Available"
                        }
                    ),

                    React.createElement(
                        Row,
                        {
                            label: "Kick",
                            value: "Available"
                        }
                    ),

                    React.createElement(
                        Row,
                        {
                            label: "Ban",
                            value: "Available"
                        }
                    ),

                    React.createElement(
                        Row,
                        {
                            label: "Message History",
                            value: "Available"
                        }
                    )
                ),

                React.createElement(
                    Text,
                    {
                        style: styles.muted
                    },
                    "Mobile Mod View"
                )
            )
        );
    }

    function getUserFromProps(props) {
        if (!props) return null;

        const candidates = [
            props.user,
            props.userData,
            props.targetUser,
            props.profile?.user,
            props.userProfile?.user,
            props.member?.user
        ];

        for (const user of candidates) {
            if (
                user &&
                typeof user.id === "string"
            ) {
                return user;
            }
        }

        return null;
    }

    function start() {
        showToast(
            "Mobile Mod View loaded"
        );

        /*
         * Profile integration intentionally
         * starts conservatively.
         *
         * Discord changes its internal profile
         * components between releases.
         */
    }

    function stop() {
        /*
         * Nothing to clean up yet.
         */
    }

    return {
        onLoad: start,
        onUnload: stop,

        ModView
    };
})
