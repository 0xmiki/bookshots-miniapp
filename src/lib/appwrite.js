import { PUBLIC_APPWRITE_PROJECT_ID } from '$env/static/public';
import { Client, Account, Functions, Databases, TablesDB } from 'appwrite';

const client = new Client();
client.setEndpoint('https://fra.cloud.appwrite.io/v1').setProject(PUBLIC_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const functions = new Functions(client);
export const databases = new Databases(client);
export const tablesDB = new TablesDB(client);

export { ID } from 'appwrite';
