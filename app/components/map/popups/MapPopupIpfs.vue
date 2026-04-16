<template>
    <div class="ipfs-info">
        <div class="ipfs-info__cols">
            <ui-text-block
                :bottom-items="[`${ obt }z`]"
                text-align="center"
                :top-items="['OBT']"
            >
                <template #top="{ item }">
                    <div class="ipfs-info__info">
                        <span>{{item}}</span>
                        <ui-tooltip
                            location="right"
                            width="250px"
                        >
                            <template #activator>
                                <div class="radio__hint">
                                    <question-icon width="16"/>
                                </div>
                            </template>
                            The time your aircraft is expected to be ready for start-up and pushback. You must be ready within ±5 minutes and call “Ready for start-up” after receiving clearance.<br><br>

                            If you have not reported “Ready for start-up” by TOBT+5, your flight plan will be suspended.
                        </ui-tooltip>
                    </div>
                </template>
            </ui-text-block>
            <ui-text-block
                v-if="status"
                :bottom-items="[status]"
                text-align="center"
                :top-items="['Status']"
            />
            <ui-text-block
                v-if="ipfs.taxi"
                :bottom-items="[`${ ipfs.taxi } mins`]"
                text-align="center"
                :top-items="['Exp. taxi time']"
            />
        </div>
        <div
            v-if="ipfs.cdmData.depInfo"
            class="ipfs-info__cols"
        >
            <ui-text-block
                :bottom-items="[ipfs.cdmData.depInfo.split('/').join(' | ')]"
                text-align="center"
                :top-items="['Departure info']"
            />
        </div>
        <ui-notification
            v-if="ipfs.cdmData.reason"
            type="info"
        >
            Reason for the CTOT: {{ ipfs.cdmData.reason }}
            <template v-if="ipfs.mostPenalizingAirspace">
                (Due to airspace: {{ipfs.mostPenalizingAirspace}})
            </template>
        </ui-notification>
        <div
            v-if="store.user?.cid === props.pilot.cid.toString()"
            class="ipfs-info_obt"
        >
            <ui-block-title
                class="ipfs-info_obt_title"
                remove-margin
            >
                Target Off-Block time

                <template #append>
                    <ui-tooltip
                        location="left"
                        width="250px"
                    >
                        <template #activator>
                            <div class="radio__hint">
                                <question-icon width="16"/>
                            </div>
                        </template>
                        OBT – Off-Blocks Time<br><br>

                        The time your aircraft is expected to be ready for start-up and pushback. You must be ready within ±5 minutes and call “Ready for start-up” after receiving clearance.<br><br>

                        If you have not reported “Ready for start-up” by OBT+5, your flight plan will be suspended.
                    </ui-tooltip>
                </template>
            </ui-block-title>

            <ui-notification type="info">
                More information about your flight: <a
                    class="__link"
                    href="https://vats.im/vdgs"
                    target="_blank"
                >VDGS Panel</a>
            </ui-notification>

            <div class="ipfs-info__cols">
                <ui-input-number
                    v-model="hrs"
                    :input-attrs="{ max: 23, min: 0 }"
                    placeholder="HH"
                >
                    Hours
                </ui-input-number>
                <ui-input-number
                    v-model="mins"
                    :input-attrs="{ max: 59, min: 0 }"
                    placeholder="MM"
                >
                    Minutes
                </ui-input-number>
                <ui-button
                    class="ipfs-info_obt_btn"
                    :disabled="saving"
                    size="M"
                    @click="saveEstimate"
                >
                    Save
                </ui-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { ViffStatus } from '~/types/data/vatsim';
import type { IpfsUser, VatsimExtendedPilot } from '~/types/data/vatsim';
import QuestionIcon from 'assets/icons/basic/question.svg?component';
import UiButton from '~/components/ui/buttons/UiButton.vue';
import UiInputNumber from '~/components/ui/inputs/UiInputNumber.vue';
import UiNotification from '~/components/ui/data/UiNotification.vue';
import UiTooltip from '~/components/ui/data/UiTooltip.vue';
import UiTextBlock from '~/components/ui/text/UiTextBlock.vue';
import UiBlockTitle from '~/components/ui/text/UiBlockTitle.vue';

const props = defineProps({
    pilot: {
        type: Object as PropType<VatsimExtendedPilot>,
        required: true,
    },
    ipfs: {
        type: Object as PropType<IpfsUser>,
        required: true,
    },
});

const store = useStore();

const obt = computed(() => {
    const ipfs = props.ipfs;

    if (ipfs.cdmData.tsat) return ipfs.cdmData.tsat.slice(0, 4);
    if (ipfs.ctot) {
        const hours = parseInt(ipfs?.ctot.slice(0, 2));
        let minutes = parseInt(ipfs?.ctot.slice(2, 4));
        minutes -= ipfs.taxi ?? 0;
        let total = (hours * 60) + minutes;
        total = (total + 1440) % 1440;

        return `${ ('0' + Math.floor(total / 60)).slice(-2) }${ ('0' + (total % 60)).slice(-2) }`;
    }
    if (ipfs.obt) return ipfs.obt.slice(0, 4);
    if (ipfs.eobt) return ipfs.eobt.slice(0, 4);

    return '';
});

const hrs = ref(0);
const mins = ref(0);
const saving = ref(false);

async function saveEstimate() {
    saving.value = true;
    try {
        await $fetch<IpfsUser>(`/api/data/vatsim/pilot/${ props.pilot.cid }/ipfs`, {
            timeout: 1000 * 15,
            method: 'POST',
            body: {
                obt: `${ ('0' + hrs.value).slice(-2) }${ ('0' + mins.value).slice(-2) }`,
            },
        });
    }
    catch (e) {
        useRadarError(e);
    }
    saving.value = false;
}

watch(() => props.ipfs?.obt, val => {
    val ||= props.ipfs?.eobt;
    if (!val) return;

    hrs.value = parseInt(val.slice(0, 2));
    mins.value = parseInt(val.slice(2, 4));
}, {
    immediate: true,
});

const status = computed(() => {
    switch (props.ipfs.atfcmStatus) {
        case ViffStatus.FLS_CDM:
        case ViffStatus.FLS_GS:
        case ViffStatus.FLS_MR:
        case ViffStatus.FLS_NRA:
            return 'Suspended';
        case ViffStatus.DES:
            return 'De-suspended';
        case ViffStatus.SRM:
            return 'Slot Revised/Updated';
        case ViffStatus.SAM:
            return 'Slot Allocated';
        case ViffStatus.ATC_ACTIV:
        default:
            return '';
    }
});
</script>

<style scoped lang="scss">
.ipfs-info {
    display: flex;
    flex-direction: column;
    gap: 8px;


    &__cols {
        display: flex;
        gap: 4px;
        align-items: flex-end;

        > * {
            flex: 1 1 0;
            width: 0;
        }
    }

    &_obt {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-left: 16px;

        &_title {
            z-index: 2;
        }

        &_btn {
            height: 44px;
        }
    }

    &__info {
        display: flex;
        gap: 4px;
        align-items: center;
        justify-content: center;
    }
}
</style>
