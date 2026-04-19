import { handleH3Error } from '~/utils/backend/h3';
import { radarStorage } from '~/utils/backend/storage';
import type { IpfsUser } from '~/types/data/vatsim';
import { isDebug } from '~/utils/backend/debug';
import { findAndRefreshUserByCookie } from '~/utils/backend/user';

const obtRegex = /^\d{4}$/;

export default defineEventHandler(async (event): Promise<IpfsUser | undefined> => {
    const config = useRuntimeConfig();
    const body = await readBody<{ obt: string }>(event);

    if (!config.VIFF_API_TOKEN) {
        handleH3Error({
            event,
            statusCode: 500,
            data: 'VIFF token not found',
        });
        return;
    }

    if (!body.obt || !obtRegex.test(body.obt)) {
        handleH3Error({
            event,
            statusCode: 400,
            data: 'Incorrect OBT format',
        });
        return;
    }

    const hours = body.obt.slice(0, 2);
    const mins = body.obt.slice(2, 4);

    if (+hours < 0 || +hours > 23 || +mins < 0 || +mins > 59) {
        handleH3Error({
            event,
            statusCode: 400,
            data: 'Incorrect OBT format',
        });
        return;
    }

    const cid = getRouterParam(event, 'cid');
    if (!cid) {
        handleH3Error({
            event,
            statusCode: 400,
            data: 'Invalid CID',
        });
        return;
    }

    const user = await findAndRefreshUserByCookie(event, false);

    if (!user) {
        handleH3Error({
            event,
            statusCode: 401,
        });

        return;
    }

    if (user.cid !== cid) {
        handleH3Error({
            event,
            statusCode: 403,
        });

        return;
    }

    const pilot = radarStorage.vatsim.extendedPilotsMap[cid];
    if (!pilot) {
        handleH3Error({
            event,
            statusCode: 404,
            data: 'Pilot with this cid is not found or offline',
        });
        return;
    }

    let viffData = await $fetch<IpfsUser>(`https://viff-system.network/ifps/callsign?callsign=${ pilot.callsign }&profile=false`, {
        timeout: 1000 * 10,
    }).catch(() => {});

    if (!viffData) {
        handleH3Error({
            event,
            statusCode: 404,
            data: 'User is not in VIFF system',
        });

        return;
    }

    await $fetch<IpfsUser>(`https://viff-system.network/ifps/dpi?callsign=${ pilot.callsign }&value=TOBT/${ body.obt }`, {
        method: 'POST',
        timeout: 1000 * 10,
        headers: {
            'x-api-key': config.VIFF_API_TOKEN,
        },
    });

    viffData = await $fetch<IpfsUser>(`https://viff-system.network/ifps/callsign?callsign=${ pilot.callsign }&profile=false`, {
        timeout: 1000 * 10,
    }).catch(() => {});

    if (!viffData) {
        handleH3Error({
            event,
            statusCode: 500,
            data: 'Something went wrong',
        });

        return;
    }

    return viffData;
});
