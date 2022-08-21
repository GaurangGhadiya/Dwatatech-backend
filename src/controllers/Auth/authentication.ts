"use strict"
import { userModel, userSessionModel } from '../../database/models'
import { apiResponse } from '../../common'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from 'config'
import { Request, Response } from 'express'
import { responseMessage } from '../../helpers/response'

const ObjectId = require('mongoose').Types.ObjectId
const jwt_token_secret = config.get('jwt_token_secret')
const refresh_jwt_token_secret = config.get('refresh_jwt_token_secret')


export const signUp = async (req: Request, res: Response) => {
    try {
        let body = req.body, authToken = 0
        
        let isAlready: any = await userModel.findOne({ email: body?.email, isActive: true })
        if (isAlready) return res.status(409).json(new apiResponse(409, responseMessage?.alreadyEmail, {}, {}))
        
        body.authToken = authToken
        const salt = await bcryptjs.genSaltSync(8)
        const hashPassword = await bcryptjs.hash(body.password, salt)
        delete body.password
        body.password = hashPassword
        await new userModel(body).save().then(async (data) => {
            return res.status(200).json(new apiResponse(200, responseMessage?.signupSuccess, { _id: data._id }, {}))
        })
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const login = async (req: Request, res: Response) => {
    let body = req.body,
        response: any
    try {
       
        response = await userModel.findOneAndUpdate({ email: body.email, isActive: true }, { lastLogin: new Date() }, { new: true }).select('-__v -createdAt -updatedAt')
        if (!response) return res.status(400).json(new apiResponse(400, responseMessage?.invalidUserPasswordEmail, {}, {}))
        const passwordMatch = await bcryptjs.compare(body.password, response.password)
        if (!passwordMatch) return res.status(400).json(new apiResponse(400, responseMessage?.invalidUserPasswordEmail, {}, {}))
        const token = jwt.sign({
            _id: response._id,
            authToken: response.authToken,
            type: response.userType,
            status: "Login",
            generatedOn: (new Date().getTime())
        }, jwt_token_secret)
        const refresh_token = jwt.sign({
            _id: response._id,
            generatedOn: (new Date().getTime())
        }, refresh_jwt_token_secret)
        await new userSessionModel({
            createdBy: response._id,
            refresh_token
        }).save()
        response = {
            userType: response?.userType,
            loginType: response?.loginType,
            _id: response?._id,
            fname: response?.fname,
            lname: response?.lname,
            email: response?.email,
            token,
            refresh_token
        }
        return res.status(200).json(new apiResponse(200, responseMessage?.loginSuccess, response, {}))

    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}




