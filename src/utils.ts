export const Random = (len: number): string => {
    const characters = "0123456789qwertyuiopasdfghjklzxcvbnm";
    let result = "";

    for (let i = 0; i < len; i++) {
        result += characters[Math.floor(Math.random() * characters.length)];
    }
    return result;
};
