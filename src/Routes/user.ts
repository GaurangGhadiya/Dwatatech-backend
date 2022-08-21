import express from 'express'
import { authenticationController } from '../controllers'
import {  userValidation } from '../validation'
const router = express.Router()

router.post('/signup', userValidation.signUp, authenticationController.signUp)
router.post('/login', userValidation.login, authenticationController.login)

export const userRouter = router