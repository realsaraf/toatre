export const mobileLandingCss = `
  .landing-menu-button {
    display: none !important;
  }

  @media (max-width: 760px) {
    .landing-nav {
      height: 72px !important;
      padding: 18px 24px 0 !important;
      align-items: center !important;
    }

    .landing-nav-links,
    .landing-nav-actions {
      display: none !important;
    }

    .landing-menu-button {
      display: inline-flex !important;
    }

    .landing-hero {
      grid-template-columns: 1fr !important;
      min-height: auto !important;
      gap: 34px !important;
      padding: 44px 28px 78px !important;
      overflow: hidden !important;
    }

    .landing-hero-left {
      max-width: 100% !important;
      padding-top: 0 !important;
    }

    .landing-hero-title {
      font-size: clamp(42px, 11vw, 54px) !important;
      line-height: 1.08 !important;
      letter-spacing: -0.035em !important;
      margin-bottom: 28px !important;
    }

    .landing-title-line {
      white-space: nowrap !important;
    }

    .landing-cta-row {
      align-items: flex-start !important;
      flex-direction: column !important;
      gap: 24px !important;
    }

    .landing-desktop-cta {
      display: none !important;
    }

    .landing-mobile-cta {
      display: flex !important;
    }

    .landing-hero-right {
      justify-content: center !important;
      padding-top: 8px !important;
      margin-top: 0 !important;
    }

    .landing-phone-frame {
      width: min(330px, 82vw) !important;
      border-radius: 42px !important;
    }
  }

  @media (max-width: 420px) {
    .landing-hero-title {
      font-size: clamp(39px, 10.4vw, 43px) !important;
    }
  }
`;
