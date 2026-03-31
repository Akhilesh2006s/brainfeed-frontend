const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    homeHero: {
      eyebrow: { type: String, trim: true, default: "" },
      title: { type: String, trim: true, default: "" },
      titleAccent: { type: String, trim: true, default: "" },
      subtitle1: { type: String, trim: true, default: "" },
      subtitle2: { type: String, trim: true, default: "" },
      backgroundImageUrl: { type: String, trim: true, default: "" },
    },
    homeLayout: {
      latestNewsFeaturedId: { type: String, trim: true, default: "" },
      latestNewsSideIds: [{ type: String, trim: true }],
      expertViewIds: [{ type: String, trim: true }],
      editorsPickIds: [{ type: String, trim: true }],
      technologyIds: [{ type: String, trim: true }],
      parentingIds: [{ type: String, trim: true }],
      latestMagazineIds: [{ type: String, trim: true }],
    },
    topBar: {
      links: [
        {
          label: { type: String, trim: true, default: "" },
          url: { type: String, trim: true, default: "" },
        },
      ],
      social: {
        facebook: { type: String, trim: true, default: "" },
        twitter: { type: String, trim: true, default: "" },
        instagram: { type: String, trim: true, default: "" },
        linkedin: { type: String, trim: true, default: "" },
        youtube: { type: String, trim: true, default: "" },
        email: { type: String, trim: true, default: "" },
      },
    },
    footer: {
      description: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      social: {
        facebook: { type: String, trim: true, default: "" },
        twitter: { type: String, trim: true, default: "" },
        instagram: { type: String, trim: true, default: "" },
        linkedin: { type: String, trim: true, default: "" },
        youtube: { type: String, trim: true, default: "" },
        email: { type: String, trim: true, default: "" },
      },
    },
    about: {
      heroEyebrow: { type: String, trim: true, default: "" },
      heroTitle: { type: String, trim: true, default: "" },
      heroBody: { type: String, trim: true, default: "" },
      heroImageUrl: { type: String, trim: true, default: "" },
      heroImageAlt: { type: String, trim: true, default: "" },
      aboutCoverMain: { type: String, trim: true, default: "" },
      aboutCoverPrimary2: { type: String, trim: true, default: "" },
      aboutCoverPrimary1: { type: String, trim: true, default: "" },
      aboutCoverJunior: { type: String, trim: true, default: "" },
      stat1Value: { type: String, trim: true, default: "" },
      stat1Label: { type: String, trim: true, default: "" },
      stat2Value: { type: String, trim: true, default: "" },
      stat2Label: { type: String, trim: true, default: "" },
      stat3Value: { type: String, trim: true, default: "" },
      stat3Label: { type: String, trim: true, default: "" },
      stat4Value: { type: String, trim: true, default: "" },
      stat4Label: { type: String, trim: true, default: "" },
      stat5Value: { type: String, trim: true, default: "" },
      stat5Label: { type: String, trim: true, default: "" },
      conferencesBody: { type: String, trim: true, default: "" },
      awardsBody: { type: String, trim: true, default: "" },
      ctaTitle: { type: String, trim: true, default: "" },
    },
    contact: {
      addressLines: [{ type: String, trim: true }],
      whatsapp: { type: String, trim: true, default: "" },
      phoneAlt: { type: String, trim: true, default: "" },
      emails: [{ type: String, trim: true }],
      regionTitle: { type: String, trim: true, default: "" },
      regionName: { type: String, trim: true, default: "" },
      regionWhatsapp: { type: String, trim: true, default: "" },
      regionEmail: { type: String, trim: true, default: "" },
      mapUrl: { type: String, trim: true, default: "" },
      mapEmbedUrl: { type: String, trim: true, default: "" },
      /** Optional static image for “Find Us”; when set, Contact page shows this instead of the iframe embed. */
      mapImageUrl: { type: String, trim: true, default: "" },
      mapImageAlt: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);

