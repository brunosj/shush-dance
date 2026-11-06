import escapeHTML from 'escape-html';
import Link from 'next/link';
import React, { Fragment } from 'react';
import { Text } from 'slate';

import {
  resolveRichTextHref,
  shouldUseNativeAnchor,
} from '../../../utilities/resolveRichTextHref';
import Button from '../Button';
import styles from './index.module.css';

type Children = Leaf[];

type Leaf = {
  type: string;
  value?: {
    url: string;
    alt: string;
  };
  children: Children;
  url?: string;
  linkType?: 'custom' | 'internal';
  doc?: { relationTo?: string; value?: unknown };
  newTab?: boolean;
  label?: string;
  [key: string]: unknown;
};

function renderLink(
  key: number,
  node: Leaf,
  inner: React.ReactNode,
): React.ReactNode {
  const { href, newTab } = resolveRichTextHref(node);
  if (!href) {
    return <Fragment key={key}>{inner}</Fragment>;
  }

  const target = newTab ? '_blank' : undefined;
  const rel = newTab ? 'noopener noreferrer' : undefined;

  if (shouldUseNativeAnchor(href, Boolean(newTab))) {
    return (
      <a
        href={escapeHTML(href)}
        key={key}
        className={styles.link}
        target={target}
        rel={rel}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} key={key} className={styles.link}>
      {inner}
    </Link>
  );
}

const serialize = (children: Children): React.ReactNode[] =>
  children.map((node, i) => {
    if (Text.isText(node)) {
      let text = (
        <span dangerouslySetInnerHTML={{ __html: escapeHTML(node.text) }} />
      );

      if (node.bold) {
        text = <strong key={i}>{text}</strong>;
      }

      if (node.code) {
        text = <code key={i}>{text}</code>;
      }

      if (node.italic) {
        text = <em key={i}>{text}</em>;
      }

      if (node.underline) {
        text = (
          <span style={{ textDecoration: 'underline' }} key={i}>
            {text}
          </span>
        );
      }

      if (node.strikethrough) {
        text = (
          <span style={{ textDecoration: 'line-through' }} key={i}>
            {text}
          </span>
        );
      }

      return <Fragment key={i}>{text}</Fragment>;
    }

    if (!node) {
      return null;
    }

    switch (node.type) {
      case 'h1':
        return <h1 key={i}>{serialize(node.children)}</h1>;
      case 'h2':
        return <h2 key={i}>{serialize(node.children)}</h2>;
      case 'h3':
        return <h3 key={i}>{serialize(node.children)}</h3>;
      case 'h4':
        return <h4 key={i}>{serialize(node.children)}</h4>;
      case 'h5':
        return <h5 key={i}>{serialize(node.children)}</h5>;
      case 'h6':
        return <h6 key={i}>{serialize(node.children)}</h6>;
      case 'blockquote':
        return <blockquote key={i}>{serialize(node.children)}</blockquote>;
      case 'ul':
        return <ul key={i}>{serialize(node.children)}</ul>;
      case 'ol':
        return <ol key={i}>{serialize(node.children)}</ol>;
      case 'li':
        return <li key={i}>{serialize(node.children)}</li>;
      case 'link':
        return renderLink(i, node, serialize(node.children));
      case 'button': {
        const { href, newTab } = resolveRichTextHref(node);
        const label =
          typeof node.label === 'string' && node.label.trim()
            ? node.label.trim()
            : 'Button';
        if (!href) {
          return (
            <div key={i} className="pt-3 mb-4">
              <Button label={label} disabled />
            </div>
          );
        }
        return (
          <div key={i} className="pt-3 mb-4">
            <Button
              href={href}
              label={label}
              target={newTab ? '_blank' : undefined}
            />
          </div>
        );
      }

      default:
        return <p key={i}>{serialize(node.children)}</p>;
    }
  });

export default serialize;
