import { createLogApiHandler } from 'hazo_logs/ui/server';

const handler = createLogApiHandler();

export const { GET, POST } = handler;
