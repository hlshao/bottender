import { TelegramClient } from 'messaging-api-telegram';
import invariant from 'invariant';
import Confirm from 'prompt-confirm';

import getWebhookFromNgrok from '../../shared/getWebhookFromNgrok';
import getConfig from '../../shared/getConfig';
import { print, error, bold, warn } from '../../shared/log';

import help from './help';

export async function getWebhook(ctx) {
  const { t, token: _token } = ctx.argv;

  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = getConfig('bottender.config.js', 'telegram');

      invariant(config.accessToken, 'accessToken is not found in config file');

      accessToken = config.accessToken;
    }

    const client = TelegramClient.connect(accessToken);
    const { ok, result } = await client.getWebhookInfo();
    invariant(ok, 'Getting Telegram webhook is failed');

    Object.keys(result).forEach(key => print(`${key}: ${result[key]}`));
  } catch (err) {
    error('Failed to get Telegram webhook');
    if (err.response) {
      error(`status: ${bold(err.response.status)}`);
      if (err.response.data) {
        error(`data: ${bold(JSON.stringify(err.response.data, null, 2))}`);
      }
    } else {
      error(err.message);
    }
    return process.exit(1);
  }
}

export async function setWebhook(ctx) {
  const { t, token: _token } = ctx.argv;
  const ngrokPort = ctx.argv['ngrok-port'] || '4040';

  let { w: webhook } = ctx.argv;
  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = getConfig('bottender.config.js', 'telegram');

      invariant(config.accessToken, 'accessToken is not found in config file');

      accessToken = config.accessToken;
    }

    const client = TelegramClient.connect(accessToken);

    if (!webhook) {
      warn('We can not find the webhook callback url you provided.');
      const prompt = new Confirm(
        `Are you using ngrok (get url from ngrok server on http://127.0.0.1:${ngrokPort})?`
      );
      const result = await prompt.run();
      if (result) {
        webhook = await getWebhookFromNgrok(ngrokPort);
      }
    }

    invariant(
      webhook,
      '`webhook` is required but not found. Use -w <webhook> to setup or make sure you are running ngrok server.'
    );

    const { ok } = await client.setWebhook(webhook);
    invariant(ok, 'Setting for webhook is failed');

    print('Successfully set Telegram webhook callback URL');
  } catch (err) {
    error('Failed to set Telegram webhook');
    if (err.response) {
      error(`status: ${bold(err.response.status)}`);
      if (err.response.data) {
        error(`data: ${bold(JSON.stringify(err.response.data, null, 2))}`);
      }
    } else {
      error(err.message);
    }
    return process.exit(1);
  }
}

export async function deleteWebhook(ctx) {
  const { t, token: _token } = ctx.argv;

  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = getConfig('bottender.config.js', 'telegram');

      invariant(config.accessToken, 'accessToken is not found in config file');

      accessToken = config.accessToken;
    }

    const client = TelegramClient.connect(accessToken);
    const { ok } = await client.deleteWebhook();
    invariant(ok, 'Deleting Telegram webhook is failed');

    print('Successfully delete Telegram webhook');
  } catch (err) {
    error('Failed to delete Telegram webhook');
    if (err.response) {
      error(`status: ${bold(err.response.status)}`);
      if (err.response.data) {
        error(`data: ${bold(JSON.stringify(err.response.data, null, 2))}`);
      }
    } else {
      error(err.message);
    }
    return process.exit(1);
  }
}

export default async function main(ctx) {
  const subcommand = ctx.argv._[2];

  switch (subcommand) {
    case 'get':
      await getWebhook(ctx);
      break;
    case 'set': {
      await setWebhook(ctx);
      break;
    }
    case 'delete':
    case 'del':
      await deleteWebhook(ctx);
      break;
    default:
      error(`Please specify a valid subcommand: get, set, delete`);
      help();
  }
}
