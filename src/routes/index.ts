import { Router } from 'express';

import brokerRouter from './broker';


const routes = Router({ strict: true });

routes.use('/broker', brokerRouter);

export default routes;
