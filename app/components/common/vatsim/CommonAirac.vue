<template>
    <div
        v-if="dataStore.versions.value?.navigraph"
        class="airac"
        :class="{
            'airac--current': !!store.user?.hasFms,
            'airac--upgrade': !store.user?.hasFms && !isIframe,
        }"
        @click="(!store.user?.hasFms && !isIframe) ? store.airacPopup = true : undefined"
    >
        <img
            alt="Navigraph"
            src="@/assets/icons/header/navigraph.svg"
            width="20"
        >

        <template v-if="store.user?.hasFms">
            AIRAC {{
                dataStore.versions.value.navigraph.current.split('-')[0]
            }}
        </template>
        <template v-else-if="isIframe">
            AIRAC {{
                dataStore.versions.value.navigraph.outdated.split('-')[0]
            }}
        </template>
        <template v-else>
            Connect Navigraph
        </template>
    </div>
</template>

<script setup lang="ts">
import { useStore } from '~/store';
import { isIframe } from '~/composables';

const dataStore = useDataStore();
const store = useStore();
</script>

<style lang="scss" scoped>
.airac {
    cursor: default;

    display: flex;
    gap: 8px;
    align-items: center;
    align-self: stretch;

    padding: 8px 12px;
    border-radius: 8px;

    font-size: 12px;
    font-weight: 600;

    background: $darkgray950;

    &--current {
        color: $lightgray125;
        background: linear-gradient(90deg, rgb(184, 42, 20, 0.25) 0%, $darkgray950 75%);
    }

    &--upgrade {
        cursor: pointer;
    }
}
</style>


