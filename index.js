(function (p, m, q, c, ui) {
    "use strict";

    // Keep the same legacy Vendetta wrapper/API that the confirmed-working
    // test plugin uses. Bunny exposes this compatibility layer.
    const React = c.React;
    const RN = c.ReactNative;

    const findByName = m.findByName;
    const findByDisplayName = m.findByDisplayName;
    const findByTypeName = m.findByTypeName;
    const findByProps = m.findByProps;

    const after = q.after;
    const showToast = ui?.toasts?.showToast;
    const clipboard = c.clipboard;

    const View = RN.View;
    const Text = RN.Text;
    const Pressable = RN.Pressable || RN.TouchableOpacity;
    const Image = RN.Image;
    const StyleSheet = RN.StyleSheet;
    const ActivityIndicator = RN.ActivityIndicator;

    const disposers = [];
    const INJECTED_MARKER = "mobile-mod-view-member-information";

    const COLORS = {
        surface: "#1e1f22",
        surfaceAlt: "#2b2d31",
        border: "#3f4147",
        text: "#f2f3f5",
        muted: "#b5bac1",
        accent: "#5865f2"
    };

    const styles = StyleSheet.create({
        container: {
            width: "100%",
            marginTop: 10,
            paddingHorizontal: 12,
            paddingBottom: 4
        },
        card: {
            backgroundColor: COLORS.surface,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: COLORS.border
        },
        header: {
            minHeight: 46,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border
        },
        headerTitle: {
            color: COLORS.text,
            fontSize: 15,
            fontWeight: "800"
        },
        section: {
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingBottom: 3
        },
        sectionTitle: {
            color: COLORS.muted,
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 0.4,
            paddingHorizontal: 14,
            paddingTop: 11,
            paddingBottom: 3
        },
        row: {
            minHeight: 36,
            paddingHorizontal: 14,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center"
        },
        rowPressable: {
            flex: 1,
            minWidth: 0,
            flexDirection: "row",
            alignItems: "center"
        },
        label: {
            flex: 1,
            marginRight: 8,
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
        copyIcon: {
            color: COLORS.muted,
            fontSize: 12,
            marginLeft: 8
        },
        roleList: {
            paddingHorizontal: 14,
            paddingBottom: 9
        },
        role: {
            backgroundColor: COLORS.surfaceAlt,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            marginTop: 7
        },
        roleNameRow: {
            flexDirection: "row",
            alignItems: "center"
        },
        roleName: {
            flex: 1,
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
            paddingBottom: 9
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
            paddingVertical: 11,
            lineHeight: 18
        },
        loading: {
            alignItems: "center",
            paddingVertical: 10
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
        const text = value == null ? "" : String(value);

        if (!text || text === "Unavailable" || text === "None") {
            return;
        }

        try {
            if (clipboard && typeof clipboard.setString === "function") {
                clipboard.setString(text);
                toast("Copied " + label);
                return;
            }
        } catch (error) {
            console.error("[Mobile Mod View] clipboard", error);
        }

        try {
            if (typeof findByProps === "function") {
                const fallback = findByProps(
                    "setString",
                    "getString",
                    "hasString"
                );

                if (
                    fallback &&
                    typeof fallback.setString === "function"
                ) {
                    fallback.setString(text);
                    toast("Copied " + label);
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
        if (!value) return "Unavailable";

        try {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return "Unavailable";
            }
            return date.toLocaleString();
        } catch {
            return "Unavailable";
        }
    }

    function getAccountCreated(id) {
        if (!id) return "Unavailable";

        try {
            const timestamp =
                Number((BigInt(String(id)) >> 22n)) +
                1420070400000;

            return formatDate(timestamp);
        } catch {
            return "Unavailable";
        }
    }

    function getAvatarUrl(user) {
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
            "?size=128"
        );
    }

    // Deliberately do NOT fall back to SelectedGuildStore. When a profile is
    // opened globally (including your own profile), there must be no server data.
    function getGuildIdFromProps(props) {
        return (
            props?.guildId ||
            props?.guild?.id ||
            props?.guild?.guild_id ||
            props?.member?.guild_id ||
            null
        );
    }

    function getChannelId() {
        try {
            const store =
                m.findByStoreName?.("SelectedChannelStore");

            return store?.getChannelId?.() || null;
        } catch {
            return null;
        }
    }

    function getUserFromProps(props) {
        return (
            props?.user ||
            props?.profileUser ||
            props?.profile?.user ||
            props?.userProfile?.user ||
            props?.member?.user ||
            props?.member?.user_data ||
            null
        );
    }

    function getUserIdFromProps(props) {
        const user = getUserFromProps(props);

        return (
            user?.id ||
            props?.userId ||
            props?.user_id ||
            props?.profile?.userId ||
            props?.profile?.user_id ||
            null
        );
    }

    function resolveUser(props) {
        const direct = getUserFromProps(props);
        if (direct?.id) return direct;

        const userId = getUserIdFromProps(props);
        if (!userId || typeof findByProps !== "function") {
            return null;
        }

        try {
            const store = findByProps(
                "getUser",
                "getCurrentUser"
            );

            const user = store?.getUser?.(String(userId));
            return user?.id ? user : null;
        } catch (error) {
            console.error(
                "[Mobile Mod View] user lookup",
                error
            );
            return null;
        }
    }

    function getRest() {
        try {
            if (typeof findByProps !== "function") return null;

            // This is the known-working Discord REST module shape from the
            // previous version. Only .get() is ever called by this plugin.
            return findByProps(
                "get",
                "post",
                "put",
                "patch",
                "del"
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
            throw new Error(
                "Discord REST GET unavailable"
            );
        }

        const response = await rest.get({ url: url });
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
        return restGet(
            "/guilds/" + guildId
        );
    }

    async function fetchRecentMessages(channelId, userId) {
        if (!channelId || !userId) return [];

        const messages = await restGet(
            "/channels/" +
                channelId +
                "/messages?limit=50"
        );

        if (!Array.isArray(messages)) {
            return [];
        }

        return messages
            .filter(
                message =>
                    String(message?.author?.id || "") ===
                    String(userId)
            )
            .slice(0, 10);
    }

    function CopyRow({ label, value, copyLabel }) {
        const display =
            value == null || value === ""
                ? "Unavailable"
                : String(value);

        const disabled =
            display === "Unavailable" ||
            display === "None";

        return React.createElement(
            View,
            { style: styles.row },
            React.createElement(
                Pressable,
                {
                    style: styles.rowPressable,
                    disabled: disabled,
                    onPress: () =>
                        copyText(
                            value,
                            copyLabel || label
                        ),
                    onLongPress: () =>
                        copyText(
                            value,
                            copyLabel || label
                        ),
                    accessibilityRole: "button",
                    accessibilityLabel:
                        "Copy " + label
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
                        numberOfLines: 4
                    },
                    display
                ),
                disabled
                    ? null
                    : React.createElement(
                          Text,
                          { style: styles.copyIcon },
                          "⧉"
                      )
            )
        );
    }

    function RoleCard({ role }) {
        if (!role?.id) return null;

        return React.createElement(
            View,
            { style: styles.role },
            React.createElement(
                Pressable,
                {
                    onPress: () =>
                        copyText(
                            role.name || "Unknown Role",
                            "role name"
                        ),
                    onLongPress: () =>
                        copyText(
                            role.name || "Unknown Role",
                            "role name"
                        ),
                    accessibilityRole: "button",
                    accessibilityLabel:
                        "Copy role name"
                },
                React.createElement(
                    View,
                    { style: styles.roleNameRow },
                    React.createElement(
                        Text,
                        { style: styles.roleName },
                        role.name || "Unknown Role"
                    ),
                    React.createElement(
                        Text,
                        { style: styles.copyIcon },
                        "⧉"
                    )
                )
            ),
            React.createElement(
                Pressable,
                {
                    onPress: () =>
                        copyText(
                            role.id,
                            "role ID"
                        ),
                    onLongPress: () =>
                        copyText(
                            role.id,
                            "role ID"
                        ),
                    accessibilityRole: "button",
                    accessibilityLabel:
                        "Copy role ID"
                },
                React.createElement(
                    Text,
                    { style: styles.roleId },
                    "Role ID: " + role.id + "  ⧉"
                )
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
            Pressable,
            {
                style: styles.message,
                onPress: () =>
                    copyText(content, "message"),
                onLongPress: () =>
                    copyText(content, "message"),
                accessibilityRole: "button",
                accessibilityLabel:
                    "Copy recent message"
            },
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

    function MemberInformation({
        user,
        suppliedGuildId
    }) {
        const guildId = suppliedGuildId || null;
        const channelId = guildId
            ? getChannelId()
            : null;

        const [member, setMember] = React.useState(null);
        const [guild, setGuild] = React.useState(null);
        const [messages, setMessages] = React.useState([]);
        const [loading, setLoading] = React.useState(Boolean(guildId));

        React.useEffect(() => {
            let cancelled = false;

            async function load() {
                if (!user?.id || !guildId) {
                    if (!cancelled) {
                        setMember(null);
                        setGuild(null);
                        setMessages([]);
                        setLoading(false);
                    }
                    return;
                }

                setLoading(true);

                const memberPromise = fetchMember(
                    guildId,
                    user.id
                ).catch(error => {
                    console.error(
                        "[Mobile Mod View] member",
                        error
                    );
                    return null;
                });

                const guildPromise = fetchGuild(
                    guildId
                ).catch(error => {
                    console.error(
                        "[Mobile Mod View] guild",
                        error
                    );
                    return null;
                });

                const messagesPromise = channelId
                    ? fetchRecentMessages(
                          channelId,
                          user.id
                      ).catch(error => {
                          console.error(
                              "[Mobile Mod View] messages",
                              error
                          );
                          return [];
                      })
                    : Promise.resolve([]);

                const results = await Promise.all([
                    memberPromise,
                    guildPromise,
                    messagesPromise
                ]);

                if (cancelled) return;

                setMember(results[0] || null);
                setGuild(results[1] || null);
                setMessages(results[2] || []);
                setLoading(false);
            }

            load().catch(error => {
                if (!cancelled) {
                    console.error(
                        "[Mobile Mod View] load",
                        error
                    );
                    setLoading(false);
                }
            });

            return () => {
                cancelled = true;
            };
        }, [user?.id, guildId, channelId]);

        const roles =
            Array.isArray(guild?.roles)
                ? guild.roles
                : [];

        const roleMap = {};
        roles.forEach(role => {
            if (role?.id) {
                roleMap[String(role.id)] = role;
            }
        });

        const roleIds =
            Array.isArray(member?.roles)
                ? member.roles
                : [];

        const memberRoles = roleIds
            .map(id => roleMap[String(id)])
            .filter(Boolean)
            .sort(
                (a, b) =>
                    Number(b?.position || 0) -
                    Number(a?.position || 0)
            );

        return React.createElement(
            View,
            {
                style: styles.container,
                nativeID: INJECTED_MARKER
            },
            React.createElement(
                View,
                { style: styles.card },

                React.createElement(
                    View,
                    { style: styles.header },
                    React.createElement(
                        Text,
                        { style: styles.headerTitle },
                        "Member Information"
                    )
                ),

                React.createElement(
                    View,
                    { style: styles.section },
                    React.createElement(
                        Text,
                        { style: styles.sectionTitle },
                        "USER"
                    ),
                    React.createElement(CopyRow, {
                        label: "Username",
                        value: user?.username,
                        copyLabel: "username"
                    }),
                    React.createElement(CopyRow, {
                        label: "Display Name",
                        value:
                            user?.global_name ||
                            user?.username,
                        copyLabel: "display name"
                    }),
                    React.createElement(CopyRow, {
                        label: "User ID",
                        value: user?.id,
                        copyLabel: "user ID"
                    }),
                    React.createElement(CopyRow, {
                        label: "Account Created",
                        value:
                            getAccountCreated(
                                user?.id
                            ),
                        copyLabel:
                            "account creation date"
                    })
                ),

                guildId
                    ? React.createElement(
                          View,
                          {
                              style:
                                  styles.section
                          },
                          React.createElement(
                              Text,
                              {
                                  style:
                                      styles.sectionTitle
                              },
                              "SERVER"
                          ),
                          React.createElement(
                              CopyRow,
                              {
                                  label: "Server ID",
                                  value: guildId,
                                  copyLabel:
                                      "server ID"
                              }
                          ),
                          React.createElement(
                              CopyRow,
                              {
                                  label: "Nickname",
                                  value:
                                      member?.nick ||
                                      "None",
                                  copyLabel:
                                      "nickname"
                              }
                          )
                      )
                    : null,

                guildId
                    ? React.createElement(
                          View,
                          {
                              style:
                                  styles.section
                          },
                          React.createElement(
                              Text,
                              {
                                  style:
                                      styles.sectionTitle
                              },
                              "ROLES (" +
                                  memberRoles.length +
                                  ")"
                          ),
                          memberRoles.length
                              ? React.createElement(
                                    View,
                                    {
                                        style:
                                            styles.roleList
                                    },
                                    memberRoles.map(
                                        role =>
                                            React.createElement(
                                                RoleCard,
                                                {
                                                    key:
                                                        String(
                                                            role.id
                                                        ),
                                                    role: role
                                                }
                                            )
                                    )
                                )
                              : React.createElement(
                                    Text,
                                    {
                                        style:
                                            styles.empty
                                    },
                                    loading
                                        ? "Loading roles..."
                                        : "No roles available."
                                )
                      )
                    : null,

                guildId
                    ? React.createElement(
                          View,
                          {
                              style:
                                  styles.section
                          },
                          React.createElement(
                              Text,
                              {
                                  style:
                                      styles.sectionTitle
                              },
                              "RECENT MESSAGES"
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
                                              ActivityIndicator,
                                              {
                                                  size: "small"
                                              }
                                          )
                                        : null,
                                    React.createElement(
                                        Text,
                                        {
                                            style:
                                                styles.empty
                                        },
                                        "Loading messages..."
                                    )
                                )
                              : messages.length
                              ? React.createElement(
                                    View,
                                    {
                                        style:
                                            styles.messageList
                                    },
                                    messages.map(
                                        message =>
                                            React.createElement(
                                                MessageCard,
                                                {
                                                    key:
                                                        String(
                                                            message.id
                                                        ),
                                                    message:
                                                        message
                                                }
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
                                        ? "No recent messages from this user in this channel."
                                        : "No channel selected."
                                )
                      )
                    : null
            )
        );
    }

    function isElement(value) {
        return Boolean(
            value &&
            typeof value === "object" &&
            value.$$typeof
        );
    }

    function hasMemberSinceText(value, depth) {
        if (depth > 8 || value == null) return false;

        if (typeof value === "string") {
            return value
                .toLowerCase()
                .includes("member since");
        }

        if (Array.isArray(value)) {
            return value.some(item =>
                hasMemberSinceText(
                    item,
                    depth + 1
                )
            );
        }

        if (!isElement(value)) return false;

        return hasMemberSinceText(
            value.props?.children,
            depth + 1
        );
    }

    function isMemberSinceSection(value) {
        if (!isElement(value)) return false;

        // A Text element containing the label is the label itself, not the
        // section we want to append to.
        if (value.type === Text) return false;

        const children = value.props?.children;
        if (children == null) return false;

        if (Array.isArray(children)) {
            return children.some(child => {
                if (typeof child === "string") {
                    return child
                        .toLowerCase()
                        .includes("member since");
                }

                if (!isElement(child)) return false;

                if (child.type === Text) {
                    return hasMemberSinceText(
                        child.props?.children,
                        0
                    );
                }

                return false;
            });
        }

        if (typeof children === "string") {
            return children
                .toLowerCase()
                .includes("member since");
        }

        return isElement(children) &&
            children.type === Text &&
            hasMemberSinceText(
                children.props?.children,
                0
            );
    }

    function hasInjectedComponent(value, depth) {
        if (depth > 20 || value == null) return false;

        if (Array.isArray(value)) {
            return value.some(item =>
                hasInjectedComponent(
                    item,
                    depth + 1
                )
            );
        }

        if (!isElement(value)) return false;

        if (
            value.props?.nativeID ===
            INJECTED_MARKER
        ) {
            return true;
        }

        return hasInjectedComponent(
            value.props?.children,
            depth + 1
        );
    }

    function injectAfterMemberSince(node, extra) {
        if (!isElement(node)) {
            return {
                node: node,
                changed: false
            };
        }

        if (hasInjectedComponent(node, 0)) {
            return {
                node: node,
                changed: false
            };
        }

        const children = node.props?.children;
        if (children == null) {
            return {
                node: node,
                changed: false
            };
        }

        const childArray = Array.isArray(children)
            ? children
            : [children];

        // Prefer the actual Member Since section as the insertion point.
        for (
            let index = 0;
            index < childArray.length;
            index++
        ) {
            if (isMemberSinceSection(childArray[index])) {
                const nextChildren = childArray.slice();
                nextChildren.splice(
                    index + 1,
                    0,
                    extra
                );

                return {
                    node: React.cloneElement(
                        node,
                        {},
                        Array.isArray(children)
                            ? nextChildren
                            : React.createElement(
                                  React.Fragment,
                                  null,
                                  childArray[0],
                                  extra
                              )
                    ),
                    changed: true
                };
            }
        }

        // Otherwise walk toward the Member Since section.
        for (
            let index = 0;
            index < childArray.length;
            index++
        ) {
            const child = childArray[index];

            if (!hasMemberSinceText(child, 0)) {
                continue;
            }

            const result = injectAfterMemberSince(
                child,
                extra
            );

            if (result.changed) {
                const nextChildren = childArray.slice();
                nextChildren[index] = result.node;

                return {
                    node: React.cloneElement(
                        node,
                        {},
                        Array.isArray(children)
                            ? nextChildren
                            : nextChildren[0]
                    ),
                    changed: true
                };
            }
        }

        return {
            node: node,
            changed: false
        };
    }

    const TARGET_NAMES = [
        "MemberSince",
        "MemberSinceSection",
        "ProfileMemberSince",
        "UserProfileMemberSince",
        "UserProfileAboutMe",
        "ProfileAboutMe",
        "UserProfile",
        "UserProfileOverview",
        "UserProfileBody",
        "ProfileBody",
        "UserProfileModal",
        "UserProfilePopout"
    ];

    function getCandidateComponents() {
        const result = [];
        const seen = [];

        for (const name of TARGET_NAMES) {
            const methods = [
                [findByName, name],
                [findByDisplayName, name],
                [findByTypeName, name]
            ];

            for (const [finder, query] of methods) {
                if (typeof finder !== "function") continue;

                try {
                    const component = finder(
                        query,
                        false
                    );

                    if (
                        component &&
                        !seen.includes(component)
                    ) {
                        seen.push(component);
                        result.push({
                            name: name,
                            component: component
                        });
                    }
                } catch (error) {
                    console.error(
                        "[Mobile Mod View] component lookup " +
                            name,
                        error
                    );
                }
            }
        }

        return result;
    }

    function patchComponent(target) {
        try {
            const unpatch = after(
                "default",
                target.component,
                (args, result) => {
                    try {
                        if (!result) return result;

                        const props = args?.[0] || {};
                        const user =
                            resolveUser(props);

                        if (!user?.id) {
                            return result;
                        }

                        if (
                            hasInjectedComponent(
                                result,
                                0
                            )
                        ) {
                            return result;
                        }

                        const guildId =
                            getGuildIdFromProps(
                                props
                            );

                        const info =
                            React.createElement(
                                MemberInformation,
                                {
                                    key:
                                        INJECTED_MARKER,
                                    user: user,
                                    suppliedGuildId:
                                        guildId
                                }
                            );

                        // If we found the actual Member Since component,
                        // append immediately after it. This is the most
                        // reliable placement possible.
                        if (
                            target.name ===
                                "MemberSince" ||
                            target.name ===
                                "MemberSinceSection" ||
                            target.name ===
                                "ProfileMemberSince" ||
                            target.name ===
                                "UserProfileMemberSince"
                        ) {
                            return React.createElement(
                                React.Fragment,
                                null,
                                result,
                                info
                            );
                        }

                        const injected =
                            injectAfterMemberSince(
                                result,
                                info
                            );

                        return injected.changed
                            ? injected.node
                            : result;
                    } catch (error) {
                        console.error(
                            "[Mobile Mod View] profile render",
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

            const candidates =
                getCandidateComponents();

            let patched = 0;

            for (const target of candidates) {
                if (patchComponent(target)) {
                    patched += 1;
                }
            }

            if (patched > 0) {
                toast(
                    "Mobile Mod View enabled"
                );
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
                const dispose =
                    disposers.pop();

                if (
                    typeof dispose ===
                    "function"
                ) {
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
    vendetta.metro.common,
    vendetta.ui
);
