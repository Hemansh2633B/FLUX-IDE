#!/usr/bin/env bash

set -ex

case $(uname -m) in
  x86_64)
    GH_ARCH="amd64"
    ;;
  aarch64)
    GH_ARCH="arm64"
    ;;
  armv7l)
    GH_ARCH="armv6"
    ;;
  *)
    echo "GH CLI does not support $(uname -m) architecture, skipping installation"
    exit 0
    ;;
esac

for i in {1..5}; do
  TAG=$( curl --retry 12 --retry-delay 30 "https://api.github.com/repos/cli/cli/releases/latest" 2>/dev/null | jq --raw-output '.tag_name' )

  if [[ $? == 0 && "${TAG}" != "null" ]]; then
    break
  fi

  if [[ $i == 5 ]]; then
    echo "GH install failed too many times" >&2
    exit 1
  fi

  echo "GH install failed $i, trying again..."

  sleep $(( 15 * (i + 1)))
done

VERSION="${TAG#v}"

curl --retry 12 --retry-delay 120 -sSL "https://github.com/cli/cli/releases/download/${TAG}/gh_${VERSION}_linux_${GH_ARCH}.tar.gz" -o "gh_${VERSION}_linux_${GH_ARCH}.tar.gz"

tar xf "gh_${VERSION}_linux_${GH_ARCH}.tar.gz"

cp "gh_${VERSION}_linux_${GH_ARCH}/bin/gh" /usr/local/bin/

gh --version
