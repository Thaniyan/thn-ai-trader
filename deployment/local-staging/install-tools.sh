#!/usr/bin/env bash
# Optional free user-space tools installation, inside the unpacked package only.
set -euo pipefail
case "$(uname -m)" in x86_64) thn_node_arch=x64;thn_caddy_arch=amd64;; aarch64|arm64) thn_node_arch=arm64;thn_caddy_arch=arm64;; *) echo 'Unsupported CPU architecture';exit 1;; esac
thn_package_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
thn_tools_dir="$thn_package_root/tools"
mkdir -p "$thn_tools_dir/bin"
thn_tmp_dir="$(mktemp -d)";trap 'rm -rf "$thn_tmp_dir"' EXIT
curl --fail --location --retry 2 --output "$thn_tmp_dir/node-checksums.txt" https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt
thn_node_file="$(awk '{print $2}' "$thn_tmp_dir/node-checksums.txt" | awk -v arch="$thn_node_arch" '$0 ~ "^node-v24\\.[0-9]+\\.[0-9]+-linux-" arch "\\.tar\\.xz$" {print;exit}')"
if [[ -z "$thn_node_file" ]];then echo 'Cannot find an official Node 24 archive';exit 1;fi
curl --fail --location --retry 2 --output "$thn_tmp_dir/$thn_node_file" "https://nodejs.org/dist/latest-v24.x/$thn_node_file"
(cd "$thn_tmp_dir";awk -v file="$thn_node_file" '$2==file' node-checksums.txt | sha256sum --check --strict)
if [[ -e "$thn_tools_dir/node24" ]];then echo 'tools/node24 already exists; preserved. Remove manually only when intentionally upgrading.';else mkdir "$thn_tools_dir/node24";tar -xJf "$thn_tmp_dir/$thn_node_file" -C "$thn_tools_dir/node24" --strip-components=1;fi
ln -sfn ../node24/bin/node "$thn_tools_dir/bin/node"
ln -sfn ../node24/bin/npm "$thn_tools_dir/bin/npm"
thn_caddy_version=2.10.2
thn_caddy_file="caddy_${thn_caddy_version}_linux_${thn_caddy_arch}.tar.gz"
thn_caddy_url="https://github.com/caddyserver/caddy/releases/download/v${thn_caddy_version}"
curl --fail --location --retry 2 --output "$thn_tmp_dir/$thn_caddy_file" "$thn_caddy_url/$thn_caddy_file"
curl --fail --location --retry 2 --output "$thn_tmp_dir/caddy-checksums.txt" "$thn_caddy_url/caddy_${thn_caddy_version}_checksums.txt"
(cd "$thn_tmp_dir";awk -v file="$thn_caddy_file" '$2==file' caddy-checksums.txt | sha512sum --check --strict)
if [[ -e "$thn_tools_dir/bin/caddy" ]];then echo 'Existing local Caddy preserved';else tar -xzf "$thn_tmp_dir/$thn_caddy_file" -C "$thn_tools_dir/bin" caddy;chmod 755 "$thn_tools_dir/bin/caddy";fi
"$thn_tools_dir/bin/node" --version
"$thn_tools_dir/bin/caddy" version
echo 'No system service installed. Run: export PATH="$PWD/tools/bin:$PATH"'
