import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import helmet from 'helmet';
import 'reflect-metadata';

import { AppModule } from './app.module';

let server: Handler;

// const port = process.env.PORT || 4000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (req, callback) => callback(null, true),
  });
  app.use(helmet());

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });

  // await app.listen(port);
}
// bootstrap().then(() => {
//   console.log('App is running on %s port', port);
// });

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  console.log("SERVER INPUT")
  server = (await bootstrap());
  return server(event, context, callback);
};
