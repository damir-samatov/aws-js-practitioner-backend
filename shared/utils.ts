import {FRONTEND_URL} from "./constants";

export const createResponse = (statusCode: number, body: any) => {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": FRONTEND_URL,
            "Access-Control-Allow-Headers":
                "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        },
        body: JSON.stringify(body),
    };
}