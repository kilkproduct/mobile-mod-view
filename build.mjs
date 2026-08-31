import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const source =
    path.resolve(
        "plugins/mobile-mod-view"
    );

const output =
    path.resolve(
        "dist/mobile-mod-view"
    );

fs.rmSync(output, {
    recursive: true,
    force: true
});

fs.mkdirSync(output, {
    recursive: true
});

const js =
    fs.readFileSync(
        path.join(source, "index.js")
    );

const hash =
    crypto
        .createHash("sha256")
        .update(js)
        .digest("hex");

const manifest =
    JSON.parse(
        fs.readFileSync(
            path.join(
                source,
                "manifest.json"
            ),
            "utf8"
        )
    );

manifest.main = "index.js";
manifest.hash = hash;

fs.writeFileSync(
    path.join(output, "index.js"),
    js
);

fs.writeFileSync(
    path.join(output, "manifest.json"),
    JSON.stringify(
        manifest,
        null,
        2
    )
);

console.log(
    "Built Mobile Mod View:"
);

console.log(
    output
);
