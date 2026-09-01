(function (p, m, q, c, ui) {
    "use strict";

    const React = c.React;
    const RN = c.ReactNative;
    const findByName = m.findByName;
    const findByNameAll = m.findByNameAll;
    const findByDisplayName = m.findByDisplayName;
    const findByDisplayNameAll = m.findByDisplayNameAll;
    const findAll = m.findAll;
    const after = q.after;

    const View = RN.View;
    const Text = RN.Text;
    const Pressable = RN.Pressable || RN.TouchableOpacity;
    const Image = RN.Image;
    const StyleSheet = RN.StyleSheet;
    const ActivityIndicator = RN.ActivityIndicator;

    const clipboard = c.clipboard;
    const showToast = ui?.toasts?.showToast;
    const disposers = [];

    const styles = StyleSheet.create({
        wrapper: {
            width: "100%",
            marginTop: 10,
            paddingHorizontal: 12,
            paddingBottom: 2
        },
        card: {
            backgroundColor: "#1e1f22",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#3f4147",
            overflow: "hidden"
        },
        title: {
            color: "#f2f3f5",
            fontSize: 15,
            fontWeight: "800",
            paddingHorizontal: 14,
            paddingTop: 13,
            paddingBottom: 9
        },
        divider: {
            height: 1,
            backgroundColor: "#3f4147"
        },
        subsection: {
            color: "#b5bac1",
            fontSize: 10,
            fontWeight: "800",
            paddingHorizontal: 14,
            paddingTop: 11,
            paddingBottom: 2,
            letterSpacing: 0.4
        },
        row: {
            minHeight: 37,
            paddingHorizontal: 14,
            paddingVertical: 7,
            flexDirection: "row",
            alignItems: "center"
        },
        rowPressed: {
            opacity: 0.6
        },
        label: {
            flex: 1,
            color: "#b5bac1",
            fontSize: 12
        },
        value: {
            flex: 1.7,
            color: "#f2f3f5",
            fontSize: 12,
            fontWeight: "600",
            textAlign: "right"
        },
        roleCard: {
            marginHorizontal: 14,
            marginTop: 7,
            backgroundColor: "#2b2d31",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#3f4147",
            overflow: "hidden"
        },
        roleRow: {
            paddingHorizontal: 10,
            paddingVertical: 8
        },
        roleName: {
            color: "#f2f3f5",
            fontSize: 12,
            fontWeight: "700"
        },
        roleId: {
            color: "#b5bac1",
            fontSize: 10
        },
        message: {
            marginHorizontal: 14,
            marginTop: 7,
            backgroundColor: "#2b2d31",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#3f4147",
            padding: 10
        },
        messageDate: {
            color: "#b5bac1",
            fontSize: 10,
            marginBottom: 4
        },
        messageText: {
            color: "#f2f3f5",
            fontSize: 12,
            lineHeight: 18
        },
        empty: {
            color: "#b5bac1",
            fontSize: 12,
            textAlign: "center",
            paddingHorizontal: 14,
            paddingVertical: 12,
            lineHeight: 18
        },
        loading: {
            paddingVertical: 12,
            alignItems: "center"
        },
        bottom: {
            height: 12
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

    function text(value) {
        if (value === null || value === undefined) return null;
        const result = String(value).trim();
        return result || null;
    }

    function date(value) {
        if (!value) return "Unknown";
        try {
            const d = new Date(value);
            return Number.isNaN(d.getTime())
                ? "Unknown"
                : d.toLocaleString();
        } catch {
            return "Unknown";
        }
    }

    function accountCreated(id) {
        if (!id) return "Unknown";
        try {
            const ms =
                Number((BigInt(String(id)) >> 22n)) +
                1420070400000;
            return date(ms);
        } catch {
            return "Unknown";
        }
    }

    function avatarUrl(user) {
        if (!user?.id || !user?.avatar) return null;
        const hash = String(user.avatar);
        const ext = hash.startsWith("a_") ? "gif" : "png";
        return (
            "https://cdn.discordapp.com/avatars/" +
            user.id +
            "/" +
            hash +
            "." +
            ext +
            "?size=128"
        );
    }

    function isUserObject(value) {
        return Boolean(
            value &&
            typeof value === "object" &&
            text(value.id) &&
            (text(value.username) || text(value.global_name))
        );
    }

    function findUser(props) {
        if (!props || typeof props !== "object") return null;

        const direct = [
            props.user,
            props.targetUser,
            props.displayProfile?.user,
            props.userProfile?.user,
            props.profile?.user,
            props.member?.user,
            props.guildMember?.user
        ];

        for (const candidate of direct) {
            if (isUserObject(candidate)) return candidate;
        }

        const seen = new WeakSet();

        function walk(value, depth) {
            if (depth > 4 || value == null) return null;
            if (isUserObject(value)) return value;
            if (typeof value !== "object") return null;
            if (seen.has(value)) return null;
            seen.add(value);

            if (Array.isArray(value)) {
                for (const item of value) {
                    const found = walk(item, depth + 1);
                    if (found) return found;
                }
                return null;
            }

            for (const key of Object.keys(value)) {
                const child = value[key];
                if (!child || typeof child !== "object") continue;
                const found = walk(child, depth + 1);
                if (found) return found;
            }

            return null;
        }

        return walk(props, 0);
    }

    // Deliberately does NOT use SelectedGuildStore. That store is global app
    // state and would make a global/self profile incorrectly show server data.
    function explicitGuildId(props) {
        if (!props || typeof props !== "object") return null;

        const direct = [
            props.guildId,
            props.guild_id,
            props.serverId,
            props.server_id
        ];

        for (const value of direct) {
            const id = text(value);
            if (id) return id;
        }

        const objects = [
            props.guild,
            props.member,
            props.guildMember,
            props.guildMemberProfile,
            props.profile,
            props.userProfile,
            props.displayProfile,
            props.userProfile?.guildMemberProfile
        ];

        for (const object of objects) {
            if (!object || typeof object !== "object") continue;

            for (const value of [
                object.guildId,
                object.guild_id,
                object.serverId,
                object.server_id
            ]) {
                const id = text(value);
                if (id) return id;
            }

            if (object.guild && typeof object.guild === "object") {
                const id = text(object.guild.id);
                if (id) return id;
            }
        }

        return null;
    }

    function channelId() {
        try {
            const findByStoreName = m.findByStoreName;
            if (typeof findByStoreName !== "function") return null;
            const store = findByStoreName("SelectedChannelStore");
            return store?.getChannelId?.() || null;
        } catch {
            return null;
        }
    }

    function restModule() {
        try {
            const findByProps = m.findByProps;
            if (typeof findByProps !== "function") return null;
            return (
                findByProps("get", "post", "put", "patch", "del") ||
                findByProps("get")
            );
        } catch (error) {
            console.error("[Mobile Mod View] REST lookup", error);
            return null;
        }
    }

    async function get(url) {
        const rest = restModule();
        if (!rest || typeof rest.get !== "function") {
            throw new Error("Discord REST API unavailable");
        }
        const response = await rest.get({ url: url });
        return response?.body;
    }

    async function getMember(guildId, userId) {
        return get(
            "/guilds/" +
                guildId +
                "/members/" +
                userId
        );
    }

    async function getGuild(guildId) {
        return get("/guilds/" + guildId);
    }

    async function getRecentMessages(channel, userId) {
        const messages = await get(
            "/channels/" +
                channel +
                "/messages?limit=50"
        );

        if (!Array.isArray(messages)) return [];

        return messages
            .filter(message => message?.author?.id === userId)
            .slice(0, 10);
    }

    async function copy(value, label) {
        const valueText = text(value);
        if (!valueText) return;

        try {
            if (clipboard && typeof clipboard.setString === "function") {
                await clipboard.setString(valueText);
                toast("Copied " + label);
                return;
            }
        } catch (error) {
            console.error("[Mobile Mod View] clipboard", error);
        }

        toast("Clipboard unavailable");
    }

    function CopyRow({ label, value }) {
        return React.createElement(
            Pressable,
            {
                onPress: () => copy(value, label),
                accessibilityRole: "button",
                accessibilityLabel: "Copy " + label
            },
            React.createElement(
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
            )
        );
    }

    function RoleCard({ role }) {
        const name = role?.name || "Unknown Role";
        const id = role?.id || null;

        return React.createElement(
            View,
            { style: styles.roleCard },
            React.createElement(
                Pressable,
                {
                    onPress: () => copy(name, "role name"),
                    accessibilityRole: "button",
                    accessibilityLabel: "Copy role name"
                },
                React.createElement(
                    View,
                    { style: styles.roleRow },
                    React.createElement(
                        Text,
                        { style: styles.roleName },
                        name
                    )
                )
            ),
            React.createElement(View, {
                style: styles.divider
            }),
            React.createElement(
                Pressable,
                {
                    onPress: () => copy(id, "role ID"),
                    accessibilityRole: "button",
                    accessibilityLabel: "Copy role ID"
                },
                React.createElement(
                    View,
                    { style: styles.roleRow },
                    React.createElement(
                        Text,
                        { style: styles.roleId },
                        "Role ID: " +
                            (id || "Unavailable")
                    )
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
                onPress: () => copy(content, "message"),
                accessibilityRole: "button",
                accessibilityLabel: "Copy message"
            },
            React.createElement(
                View,
                { style: styles.message },
                React.createElement(
                    Text,
                    { style: styles.messageDate },
                    date(message?.timestamp)
                ),
                React.createElement(
                    Text,
                    { style: styles.messageText },
                    content
                )
            )
        );
    }

    function MemberInformation({ user, guildId }) {
        const currentChannelId = guildId ? channelId() : null;

        const [member, setMember] = React.useState(null);
        const [guild, setGuild] = React.useState(null);
        const [messages, setMessages] = React.useState([]);
        const [loading, setLoading] = React.useState(Boolean(guildId));
        const [loaded, setLoaded] = React.useState(false);

        React.useEffect(() => {
            let cancelled = false;

            async function load() {
                setLoading(Boolean(guildId));
                setLoaded(false);

                if (!guildId || !user?.id) {
                    if (!cancelled) {
                        setMember(null);
                        setGuild(null);
                        setMessages([]);
                        setLoading(false);
                        setLoaded(true);
                    }
                    return;
                }

                let memberData = null;
                let guildData = null;
                let messageData = [];

                try {
                    memberData = await getMember(guildId, user.id);
                } catch (error) {
                    console.error(
                        "[Mobile Mod View] member fetch",
                        error
                    );
                }

                try {
                    guildData = await getGuild(guildId);
                } catch (error) {
                    console.error(
                        "[Mobile Mod View] guild fetch",
                        error
                    );
                }

                if (currentChannelId) {
                    try {
                        messageData = await getRecentMessages(
                            currentChannelId,
                            user.id
                        );
                    } catch (error) {
                        console.error(
                            "[Mobile Mod View] message fetch",
                            error
                        );
                    }
                }

                if (cancelled) return;

                setMember(memberData || null);
                setGuild(guildData || null);
                setMessages(
                    Array.isArray(messageData)
                        ? messageData
                        : []
                );
                setLoading(false);
                setLoaded(true);
            }

            load();

            return () => {
                cancelled = true;
            };
        }, [guildId, user?.id, currentChannelId]);

        const roleMap = {};
        const guildRoles = Array.isArray(guild?.roles)
            ? guild.roles
            : [];

        guildRoles.forEach(role => {
            if (role?.id) roleMap[String(role.id)] = role;
        });

        const roleIds = Array.isArray(member?.roles)
            ? member.roles
            : [];

        const roles = roleIds
            .map(id => roleMap[String(id)])
            .filter(Boolean)
            .sort(
                (a, b) =>
                    Number(b?.position || 0) -
                    Number(a?.position || 0)
            );

        return React.createElement(
            View,
            { style: styles.wrapper },
            React.createElement(
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
                    Text,
                    { style: styles.subsection },
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
                              Text,
                              { style: styles.subsection },
                              "SERVER"
                          ),
                          React.createElement(CopyRow, {
                              label: "Server ID",
                              value: guildId
                          }),
                          React.createElement(CopyRow, {
                              label: "Nickname",
                              value:
                                  member?.nick ||
                                  "None"
                          })
                      )
                    : null,

                guildId
                    ? React.createElement(
                          React.Fragment,
                          null,
                          React.createElement(
                              Text,
                              { style: styles.subsection },
                              "ROLES"
                          ),
                          roles.length
                              ? roles.map(role =>
                                    React.createElement(
                                        RoleCard,
                                        {
                                            key: String(role.id),
                                            role: role
                                        }
                                    )
                                )
                              : React.createElement(
                                    Text,
                                    { style: styles.empty },
                                    loaded
                                        ? "No roles found."
                                        : "Loading roles..."
                                ),
                          React.createElement(View, {
                              style: styles.bottom
                          })
                      )
                    : null,

                guildId
                    ? React.createElement(
                          React.Fragment,
                          null,
                          React.createElement(
                              Text,
                              { style: styles.subsection },
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
                                        "Loading messages..."
                                    )
                                )
                              : messages.length
                              ? React.createElement(
                                    View,
                                    null,
                                    messages.map(message =>
                                        React.createElement(
                                            MessageCard,
                                            {
                                                key: String(message.id),
                                                message: message
                                            }
                                        )
                                    ),
                                    React.createElement(View, {
                                        style: styles.bottom
                                    })
                                )
                              : React.createElement(
                                    Text,
                                    { style: styles.empty },
                                    currentChannelId
                                        ? "No recent messages from this user in this channel."
                                        : "No channel selected."
                                )
                      )
                    : null
            )
        );
    }

    function memberSinceLabels() {
        const labels = ["Member Since"];

        try {
            const messages = c?.i18n?.Messages;
            if (messages && typeof messages === "object") {
                for (const key of Object.keys(messages)) {
                    if (/MEMBER.*SINCE/.test(key)) {
                        const value = messages[key];
                        if (typeof value === "string") {
                            labels.push(value);
                        }
                    }
                }
            }
        } catch {}

        return labels;
    }

    function containsMemberSince(value, seen, depth) {
        if (depth > 10 || value == null) return false;

        const labels = memberSinceLabels();

        if (typeof value === "string") {
            const normalized = value
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();

            return labels.some(label =>
                normalized.includes(
                    String(label)
                        .replace(/\s+/g, " ")
                        .trim()
                        .toLowerCase()
                )
            );
        }

        if (typeof value !== "object") return false;

        if (!seen) seen = new WeakSet();
        if (seen.has(value)) return false;
        seen.add(value);

        if (Array.isArray(value)) {
            return value.some(item =>
                containsMemberSince(item, seen, depth + 1)
            );
        }

        const props = value.props;
        if (props && typeof props === "object") {
            for (const key of Object.keys(props)) {
                if (key === "style" || key === "source") continue;
                if (
                    containsMemberSince(
                        props[key],
                        seen,
                        depth + 1
                    )
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    function injectAfterMemberSince(root, injected) {
        if (!React.isValidElement(root)) {
            return { node: root, injected: false };
        }

        const children = React.Children.toArray(
            root.props?.children
        );

        if (!children.length) {
            return { node: root, injected: false };
        }

        const next = [];
        let didInject = false;

        for (const child of children) {
            if (!didInject && containsMemberSince(child)) {
                if (React.isValidElement(child)) {
                    // Never put a View inside Text. Place our section beside
                    // the Member Since text node instead.
                    if (child.type === Text) {
                        next.push(child, injected);
                        didInject = true;
                        continue;
                    }

                    const nested = injectAfterMemberSince(
                        child,
                        injected
                    );

                    if (nested.injected) {
                        next.push(nested.node);
                        didInject = true;
                    } else {
                        next.push(child, injected);
                        didInject = true;
                    }
                } else {
                    next.push(child, injected);
                    didInject = true;
                }
            } else {
                next.push(child);
            }
        }

        return didInject
            ? {
                  node: React.cloneElement(
                      root,
                      {},
                      next
                  ),
                  injected: true
              }
            : {
                  node: root,
                  injected: false
              };
    }

    function appendToRoot(root, injected) {
        if (!React.isValidElement(root)) return root;

        // Never place a View inside a Text element. If the target itself is
        // Text, leave it untouched rather than producing an invalid RN tree.
        if (root.type === Text) return root;

        const children = React.Children.toArray(
            root.props?.children
        );

        return React.cloneElement(
            root,
            {},
            children.concat(injected)
        );
    }

    function moduleSource(value) {
        const candidates = [
            value,
            value?.default,
            value?.type,
            value?.default?.type
        ];

        for (const candidate of candidates) {
            if (typeof candidate !== "function") continue;
            try {
                return Function.prototype.toString.call(candidate);
            } catch {}
        }

        return "";
    }

    function profileScore(value) {
        const source = moduleSource(value);
        if (!source) return -1;

        let score = 0;

        if (/Member\s+Since/i.test(source)) score += 100;
        if (/MEMBER[_A-Z]*SINCE/.test(source)) score += 90;
        if (/About\s+Me/i.test(source)) score += 75;
        if (/about[_A-Z]*me/i.test(source)) score += 65;
        if (/UserProfile/i.test(source)) score += 35;
        if (/Profile/i.test(source)) score += 10;

        return score;
    }

    function addUnique(list, value) {
        if (!value) return;
        if (list.includes(value)) return;
        list.push(value);
    }

    function locateProfileComponent() {
        const candidates = [
            "UserProfileInfoSection",
            "UserProfileAboutMe",
            "UserProfileDetails",
            "UserProfileOverview",
            "UserProfileOverviewWrapper",
            "UserProfileBody",
            "UserProfileBodyWrapper",
            "UserProfile"
        ];

        function directLookup(name, defaultExp) {
            try {
                if (typeof findByName === "function") {
                    const result = findByName(name, defaultExp);
                    if (result) return result;
                }
            } catch (error) {
                console.error(
                    "[Mobile Mod View] name lookup " + name,
                    error
                );
            }

            try {
                if (typeof findByDisplayName === "function") {
                    const result = findByDisplayName(name, defaultExp);
                    if (result) return result;
                }
            } catch (error) {
                console.error(
                    "[Mobile Mod View] display-name lookup " + name,
                    error
                );
            }

            return null;
        }

        // Fast path: normal Metro name/display-name lookup.
        for (const name of candidates) {
            for (const defaultExp of [true, false]) {
                const result = directLookup(name, defaultExp);
                if (result) return result;
            }
        }

        // Compatibility path: a Discord update may leave multiple matching
        // modules or expose a component through a different export shape.
        const allResults = [];

        function collectAll(name, defaultExp, finder) {
            if (typeof finder !== "function") return;

            try {
                const result = finder(name, defaultExp);
                if (!Array.isArray(result)) return;

                for (const item of result) {
                    addUnique(allResults, item);
                }
            } catch (error) {
                console.error(
                    "[Mobile Mod View] all-module lookup " + name,
                    error
                );
            }
        }

        for (const name of candidates) {
            for (const defaultExp of [true, false]) {
                collectAll(name, defaultExp, findByNameAll);
                collectAll(name, defaultExp, findByDisplayNameAll);
            }

            if (allResults.length) break;
        }

        let best = null;
        let bestScore = -1;

        for (const module of allResults) {
            const score = profileScore(module);
            if (score > bestScore) {
                bestScore = score;
                best = module;
            }
        }

        if (best) return best;

        // Final compatibility path for builds where Discord renamed the
        // component entirely. Vendetta's findAll initializes Metro modules
        // while suppressing module-load exceptions, so this is safe to use as
        // a last resort rather than during ordinary plugin startup.
        if (typeof findAll === "function") {
            try {
                const found = findAll(module =>
                    profileScore(module) >= 75
                );

                if (Array.isArray(found) && found.length) {
                    let sourceBest = found[0];
                    let sourceScore = profileScore(sourceBest);

                    for (let i = 1; i < found.length; i++) {
                        const score = profileScore(found[i]);
                        if (score > sourceScore) {
                            sourceBest = found[i];
                            sourceScore = score;
                        }
                    }

                    return sourceBest;
                }
            } catch (error) {
                console.error(
                    "[Mobile Mod View] profile source scan",
                    error
                );
            }
        }

        // The original working plugin proved HeaderAvatar exists in at least
        // one Bunny build. Keep it only as an emergency fallback so the plugin
        // remains usable rather than completely failing to load.
        try {
            if (typeof findByName === "function") {
                for (const defaultExp of [true, false]) {
                    const header =
                        findByName("HeaderAvatar", defaultExp);
                    if (header) return header;
                }
            }
        } catch (error) {
            console.error(
                "[Mobile Mod View] HeaderAvatar fallback",
                error
            );
        }

        return null;
    }

    function patchProfile() {
        if (typeof after !== "function") return false;

        const target = locateProfileComponent();
        if (!target) return false;

        try {
            const unpatch = after(
                "default",
                target.component,
                (args, result) => {
                    try {
                        if (!React.isValidElement(result)) {
                            return result;
                        }

                        const props = args?.[0] || {};
                        const user =
                            findUser(props) ||
                            findUser(result?.props);
                        if (!user?.id) return result;

                        const injected = React.createElement(
                            MemberInformation,
                            {
                                user: user,
                                guildId: explicitGuildId(props)
                            }
                        );

                        const transformed = injectAfterMemberSince(
                            result,
                            injected
                        );

                        if (transformed.injected) {
                            return transformed.node;
                        }

                        // If Member Since is rendered by a nested/composite
                        // component that cannot be inspected from this return
                        // tree, append to the profile-information container.
                        // For the semantic profile-section candidates found
                        // above, this is still immediately after the existing
                        // information block.
                        return appendToRoot(result, injected);
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
                "[Mobile Mod View] patch failed",
                error
            );
        }

        return false;
    }

    function start() {
        try {
            if (!React || !RN || !StyleSheet) {
                console.error(
                    "[Mobile Mod View] React API unavailable"
                );
                return;
            }

            if (patchProfile()) {
                console.log("[Mobile Mod View] profile hook installed");
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
})(
    {},
    vendetta.metro,
    vendetta.patcher,
    vendetta.metro.common,
    vendetta.ui
);
