"use strict"
import { Request, Router, Response } from 'express'
import { userRouter } from './user'



const router = Router()

router.use('/user', userRouter)


export { router }