<!-- ![SHUSH Logo](https://res.cloudinary.com/) -->

## Description

This repo contains the website of [SHUSH](https://shush.dance).

## Technologies

This is a [Next.js](https://nextjs.org) app using the [App Router](https://nextjs.org/docs/app). Data is sourced from [Payload](https://payloadcms.com/) and the backend lives on the same server at /admin. It integrates with [Stripe](https://stripe.com/) and [Paypal](https://www.paypal.com/) for payments.

## Installation

1. Use the git CLI to close the repo

```
gh repo clone brunosj/shush-dance
```

2. Install dependencies

```bash
pnpm install
# or
yarn install
```

3. Navigate into the site's directory and start the development server

```bash
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the frontend, and [http://localhost:3000/admin](http://localhost:3000/admin) for the backend.

## Structure

```
.
├── node_modules
├── public
    ├── locales
└── src
    ├── api
    ├── common
    ├── hooks
    ├── modules
    ├── pages
    ├── styles
    ├── types
    ├── utils
├── .eslintrc.json
├── .gitignore
├── next-i18next.config.js
├── next-config.js
├── pnpm-lock.yaml
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
└── tsconfig.json


```

## Further development

This repository is maintained by [brunosj](https://github.com/brunosj).
