declare namespace NodeJS {
    interface ProcessEnv {
        JWT_SECRET: string;
        MONGODB_URI: string;
    }
}