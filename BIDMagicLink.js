/**
 * Copyright (c) 2018, 1Kosmos Inc. All rights reserved.
 * Licensed under 1Kosmos Open Source Public License version 1.0 (the "License");
 * You may not use this file except in compliance with the License. 
 * You may obtain a copy of this license at 
 *    https://github.com/1Kosmos/1Kosmos_License/blob/main/LICENSE.txt
 */

"use strict";
const { v4: uuidv4 } = require('uuid');

const BIDECDSA = require('./BIDECDSA');
const fetch = require('node-fetch');
const BIDTenant = require('./BIDTenant');

const requestMagicLink = async (tenantInfo, userId, emailTo, emailTemplateB64, emailSubject, type, version) => {
    try {
        const communityInfo = await BIDTenant.getCommunityInfo(tenantInfo);
        const keySet = BIDTenant.getKeySet();
        const licenseKey = tenantInfo.licenseKey;
        const sd = await BIDTenant.getSD(tenantInfo);

        const {
            community: {
                publicKey: communityPublicKey,
                name: communityName
            },
            tenant: {
                tenanttag: tenantTag
            }
        } = communityInfo;

        let sharedKey = BIDECDSA.createSharedKey(keySet.prKey, communityPublicKey);

        const encryptedRequestId = BIDECDSA.encrypt(JSON.stringify({
            ts: Math.round(new Date().getTime() / 1000),
            appid: 'fixme',
            uuid: uuidv4()
        }), sharedKey);

        let headers = {
            'Content-Type': 'application/json',
            'charset': 'utf-8',
            'X-tenantTag': tenantTag,
            publickey: keySet.pKey,
            licensekey: BIDECDSA.encrypt(licenseKey, sharedKey),
            requestid: encryptedRequestId
        };

        const req = {
            createdBy: "helper-files",
            version,
            type,
            userId,
            emailTo,
            emailTemplateB64,
            emailSubject
        };

        const encryptedData = BIDECDSA.encrypt(
            JSON.stringify(req),
            sharedKey
        );

        let api_response = await fetch(sd.adminconsole + "/api/r2/acr/community/" + communityName + "/code", {
            method: 'put',
            body: JSON.stringify({ data: encryptedData }),
            headers: headers
        });

        if (api_response) {
            api_response = await api_response.json();
        }
        
        return api_response;
        
    } catch (error) {
        throw error;
    }
}

const requestEmailVerificationLink = async (tenantInfo, userId, emailTo, emailTemplateB64, emailSubject) => {
    try {

        const version = "v0";
        const type = "verification_link";

        const response = await requestMagicLink(tenantInfo, userId, emailTo, emailTemplateB64, emailSubject, type, version);

        return response;

    } catch (error) {
        throw error;
    }
}

module.exports = {
    requestEmailVerificationLink
}
