require('dotenv').config();

import createError from "http-errors";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import moment from 'moment'
import response from "./utils/response";
import v1Router from './routes/v1'

import jwtMiddleware from './middlewares/jwt.middleware'
import { logger, stream } from './configs/winston'

const app = express();

app.use(morgan('combined', { stream }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 컨트롤러를 타기 전에 jwt 로부터 user 를 조회
app.use(jwtMiddleware)

app.use('/v1', v1Router)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  let apiError = err

  if(!err.status) {
    apiError = createError(err)
  }

  if (process.env.NODE_ENV === 'test') {
    const errObj = {
      req: {
        headers: req.headers,
        query: req.query,
        body: req.body,
        route: req.route
      },
      error: {
        message: apiError.message,
        stack: apiError.stack,
        status: apiError.status
      },
      user: req.user
    }

    logger.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}`, errObj)
  } else {
    // set locals, only providing error in development
    res.locals.message = apiError.message;
    res.locals.error = process.env.NODE_ENV === 'development' ? apiError : {}
  }

  // render the error page
  return response(res, {
    message: apiError.message
  }, apiError.status)
})

module.exports = app