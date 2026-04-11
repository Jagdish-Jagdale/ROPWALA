import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonEN from './locales/en/common.json';
import dashboardEN from './locales/en/dashboard.json';
import categoryEN from './locales/en/category.json';
import productEN from './locales/en/product.json';
import orderEN from './locales/en/order.json';
import authEN from './locales/en/auth.json';
import validationEN from './locales/en/validation.json';
import franchiseEN from './locales/en/franchise.json';
import usersEN from './locales/en/users.json';
import bannerEN from './locales/en/banner.json';
import reportsEN from './locales/en/reports.json';
import settingsEN from './locales/en/settings.json';
import hamipatraEN from './locales/en/hamipatra.json';

import commonMR from './locales/mr/common.json';
import dashboardMR from './locales/mr/dashboard.json';
import categoryMR from './locales/mr/category.json';
import productMR from './locales/mr/product.json';
import orderMR from './locales/mr/order.json';
import authMR from './locales/mr/auth.json';
import validationMR from './locales/mr/validation.json';
import franchiseMR from './locales/mr/franchise.json';
import usersMR from './locales/mr/users.json';
import bannerMR from './locales/mr/banner.json';
import reportsMR from './locales/mr/reports.json';
import settingsMR from './locales/mr/settings.json';
import hamipatraMR from './locales/mr/hamipatra.json';

const resources = {
  en: {
    common: commonEN,
    dashboard: dashboardEN,
    category: categoryEN,
    product: productEN,
    order: orderEN,
    auth: authEN,
    validation: validationEN,
    franchise: franchiseEN,
    users: usersEN,
    banner: bannerEN,
    reports: reportsEN,
    settings: settingsEN,
    hamipatra: hamipatraEN,
  },
  mr: {
    common: commonMR,
    dashboard: dashboardMR,
    category: categoryMR,
    product: productMR,
    order: orderMR,
    auth: authMR,
    validation: validationMR,
    franchise: franchiseMR,
    users: usersMR,
    banner: bannerMR,
    reports: reportsMR,
    settings: settingsMR,
    hamipatra: hamipatraMR,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'dashboard', 'category', 'product', 'order', 'auth', 'validation', 'franchise', 'users', 'banner', 'reports', 'settings', 'hamipatra'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
