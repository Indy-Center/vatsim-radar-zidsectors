<template>
    <div class="ipfs-info">
        <div
            class="ipfs-info__cols"
            :class="{ 'ipfs-info__cols--rows': blocks.length >= 4 }"
        >
            <ui-text-block
                v-for="(block, index) in blocks"
                :key="block.title"
                :bottom-items="[block.value]"
                text-align="center"
                :top-items="[block.title]"
            >
                <template #top="{ item }">
                    <div class="ipfs-info__info">
                        <span>{{item}}</span>
                        <ui-tooltip
                            v-if="block.hint"
                            :location="getTooltipLocation(index)"
                            width="250px"
                        >
                            <template #activator>
                                <div class="radio__hint">
                                    <question-icon width="16"/>
                                </div>
                            </template>
                            {{block.hint}}
                        </ui-tooltip>
                    </div>
                </template>
            </ui-text-block>
        </div>
        <div
            v-if="status || ipfs.cdmData.depInfo || ipfs.aobt"
            class="ipfs-info__cols"
        >
            <ui-text-block
                v-if="status"
                :bottom-items="[status]"
                text-align="center"
                :top-items="['Status']"
            >
                <template #top="{ item }">
                    <div class="ipfs-info__info">
                        <span>{{item}}</span>
                        <ui-tooltip
                            v-if="statusHint"
                            :location="(ipfs.cdmData.depInfo || ipfs.aobt) ? 'right' : 'bottom'"
                            width="250px"
                        >
                            <template #activator>
                                <div class="radio__hint">
                                    <question-icon width="16"/>
                                </div>
                            </template>
                            {{statusHint}}
                        </ui-tooltip>
                    </div>
                </template>
            </ui-text-block>
            <ui-text-block
                v-if="ipfs.cdmData.depInfo"
                :bottom-items="[ipfs.cdmData.depInfo.split('/').join(' | ')]"
                text-align="center"
                :top-items="['Departure info']"
            />
            <ui-text-block
                v-if="ipfs.aobt"
                :bottom-items="[`${ ipfs.aobt.slice(0,4) }z`]"
                text-align="center"
                :top-items="['AOBT']"
            />
        </div>
        <ui-notification
            v-if="ipfs.cdmData.reason"
            type="info"
        >
            Reason for the CTOT: {{ ipfs.cdmData.reason }}
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

                        The time your aircraft is expected to be ready for start-up and pushback.
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

            <ui-notification
                v-if="props.ipfs?.atfcmStatus.startsWith('FLS')"
                type="error"
            >
                Your flight has been suspended. Please, update your OBT
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
import { ViffRegulationType, ViffStatus } from '~/types/data/vatsim';
import type { IpfsUser, VatsimExtendedPilot } from '~/types/data/vatsim';
import QuestionIcon from 'assets/icons/basic/question.svg?component';
import UiButton from '~/components/ui/buttons/UiButton.vue';
import UiInputNumber from '~/components/ui/inputs/UiInputNumber.vue';
import UiNotification from '~/components/ui/data/UiNotification.vue';
import UiTooltip from '~/components/ui/data/UiTooltip.vue';
import type { TooltipLocation } from '~/components/ui/data/UiTooltip.vue';
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

interface Block {
    title: string;
    value: string;
    hint?: string;
}

function getTooltipLocation(index: number): TooltipLocation {
    if (blocks.value.length === 2 || blocks.value.length === 4) {
        return index % 2 === 0 ? 'right' : 'left';
    }

    if (blocks.value.length === 3) {
        if (index === 0) return 'right';
        if (index === 1) return 'bottom';
        if (index === 2) return 'left';
    }

    return 'bottom';
}

const blocks = computed(() => {
    const items: Block[] = [];

    if (props.ipfs?.isCdm && (props.ipfs.cdmData.tobt || props.ipfs.obt || props.ipfs.eobt)) {
        items.push({
            title: props.ipfs.cdmData.tobt ? 'TOBT' : props.ipfs.obt ? 'OBT' : 'EOBT',
            value: `${ (props.ipfs.cdmData.tobt || props.ipfs.obt || props.ipfs.eobt).slice(0, 4) }z`,
            hint: 'Target Off-Blocks Time. The time your aircraft is expected to be ready for start-up and pushback',
        });
    }

    if (!props.ipfs?.isCdm && (props.ipfs?.obt || props.ipfs?.eobt)) {
        items.push({
            title: 'OBT',
            value: `${ (props.ipfs.obt || props.ipfs.eobt).slice(0, 4) }z`,
            hint: 'Target Off-Blocks Time. The time your aircraft is expected to be ready for start-up and pushback',
        });
    }

    if (props.ipfs?.isCdm && props.ipfs.cdmData.tsat) {
        items.push({
            title: 'TSAT',
            value: `${ props.ipfs.cdmData.tsat.slice(0, 4) }z`,
            hint: 'Target Start-Up Approval Time. The time when start-up clearance can be expected, ±5 minutes of TSAT',
        });
    }

    if (props.ipfs.ctot) {
        const hours = parseInt(props.ipfs?.ctot.slice(0, 2));
        let minutes = parseInt(props.ipfs?.ctot.slice(2, 4));
        minutes -= props.ipfs.taxi ?? 0;
        let total = (hours * 60) + minutes;
        total = (total + 1440) % 1440;

        const value = `${ ('0' + Math.floor(total / 60)).slice(-2) }${ ('0' + (total % 60)).slice(-2) }z`;

        items.push({
            title: 'CTOT',
            value,
            hint: 'Calculated Take-Off Time. The time assigned for your take-off to ensure traffic flow and airspace management',
        });
    }

    if (props.ipfs.cdmData.mostPenalisingRegulation) {
        let hint: string | undefined;
        switch (props.ipfs.cdmData.mostPenalisingRegulationType) {
            case ViffRegulationType.AD:
                hint = 'Regulation due to airport';
                break;
            case ViffRegulationType.ENR:
                hint = 'Enroute regulation';
                break;
            case ViffRegulationType.ECFMP:
                hint = 'ECFMP regulation';
                break;
        }

        items.push({
            title: 'REGUL',
            value: props.ipfs.cdmData.mostPenalisingRegulation,
            hint,
        });
    }

    return items;
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
            return 'Slot Revised';
        case ViffStatus.SAM:
            return 'Slot Allocated';
        case ViffStatus.ATC_ACTIV:
            return 'Departing';
        case ViffStatus.REA:
            return 'Ready';
        default:
            return '';
    }
});

const statusHint = computed(() => {
    switch (props.ipfs.atfcmStatus) {
        case ViffStatus.FLS_CDM:
            return 'Flight Suspended due to not airborne in time';
        case ViffStatus.FLS_GS:
            return 'Flight Suspended by CDM';
        case ViffStatus.FLS_MR:
            return 'Flight suspended due to mandatory route';
        case ViffStatus.FLS_NRA:
            return 'Flight suspended due to ground stop';
        case ViffStatus.DES:
            return 'Flight is De-Suspended';
        case ViffStatus.SRM:
            return 'CTOT has been updated';
        case ViffStatus.SAM:
            return 'CTOT has been allocated';
        case ViffStatus.ATC_ACTIV:
            return 'Flight is already in movement';
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
