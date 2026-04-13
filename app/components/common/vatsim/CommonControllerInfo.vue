<template>
    <div
        class="atc-popup-container"
        :class="{
            'atc-popup-container--absolute': absolute,
            'atc-popup-container--small': small,
        }"
    >
        <common-popup-block class="atc-popup">
            <template
                v-if="$slots.title"
                #title
            >
                <slot name="title"/>
            </template>
            <template
                v-if="$slots.additionalTitle"
                #additionalTitle
            >
                <slot name="additionalTitle"/>
            </template>
            <div class="atc-popup_list">
                <common-single-controller-info
                    v-for="(controller, controllerIndex) in getControllers"
                    :key="controller.cid + controllerIndex"
                    :controller="controller"
                    :show-atis="showAtis"
                    :show-facility="showFacility"
                    @overlay="emit('overlay')"
                />
            </div>
        </common-popup-block>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { VatsimShortenedController } from '~/types/data/vatsim';
import CommonSingleControllerInfo from '~/components/common/vatsim/CommonSingleControllerInfo.vue';
import CommonPopupBlock from '~/components/common/popup/CommonPopupBlock.vue';

const props = defineProps({
    controllers: {
        type: Array as PropType<VatsimShortenedController[]>,
        required: true,
    },
    showFacility: {
        type: Boolean,
        default: false,
    },
    showAtis: {
        type: Boolean,
        default: false,
    },
    absolute: {
        type: Boolean,
        default: false,
    },
    small: {
        type: Boolean,
        default: false,
    },
    maxHeight: {
        type: String,
        default: '400px',
    },
});

const emit = defineEmits({
    overlay() {
        return true;
    },
});

defineSlots<{ title?(): any; additionalTitle?(): any }>();

const getControllers = computed(() => {
    const facilities = useFacilitiesIds();
    let ctrAllDuplicated = true;
    let appAllDuplicated = true;
    const realCallsigns = new Set<string>();

    for (const controller of props.controllers) {
        if (!controller.duplicated) {
            realCallsigns.add(controller.callsign);
        }
    }

    for (const controller of props.controllers) {
        if (controller.facility === facilities.CTR && !controller.duplicated) ctrAllDuplicated = false;
        if (controller.facility === facilities.APP && (!controller.duplicated || realCallsigns.has(controller.duplicatedBy ?? ''))) appAllDuplicated = false;
    }

    return props.controllers?.filter(x => !x.duplicated || (x.facility === facilities.CTR ? ctrAllDuplicated : x.facility === facilities.APP ? appAllDuplicated : true));
});
</script>

<style scoped lang="scss">
.atc-popup {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &-container {
        cursor: initial;

        z-index: 20;

        width: max-content;
        max-width: 450px;
        padding: 5px 0;

        &--small {
            max-width: min(450px, 100%);
        }

        &--absolute {
            position: absolute;
        }

        @include mobileOnly {
            max-width: 80vw;
        }
    }

    &_list {
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;

        max-height: v-bind(maxHeight);
    }
}
</style>
