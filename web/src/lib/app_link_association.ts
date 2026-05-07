export const appleAppSiteAssociation = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "8B9NZ6FRKF.com.toatre.app",
        paths: ["/j/*"],
      },
    ],
  },
};

export const assetLinks = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.toatre.app",
      sha256_cert_fingerprints: [
        "2B:D3:D5:CE:AE:5D:C7:1D:46:13:A8:F6:4C:99:32:65:83:8C:9F:EC:3C:CA:FC:A7:B9:56:F2:87:45:C5:AE:15",
      ],
    },
  },
];

export function associationHeaders(contentType: string): HeadersInit {
  return {
    "Cache-Control": "public, max-age=300, s-maxage=300",
    "Content-Type": contentType,
  };
}