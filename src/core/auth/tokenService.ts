import { storage } from "../storage/mmkv";

const ACCESS = "access_token";
const REFRESH = "refresh_token";


export const tokenService = {

  setTokens(
    access: string,
    refresh: string,
  ) {

    storage.setString(
      ACCESS,
      access,
    );

    storage.setString(
      REFRESH,
      refresh,
    );

  },


  getAccessToken(): string | null {

    return storage.getString(
      ACCESS,
    );

  },


  getRefreshToken(): string | null {

    return storage.getString(
      REFRESH,
    );

  },


  clear() {

    storage.delete(
      ACCESS,
    );

    storage.delete(
      REFRESH,
    );

  },

};