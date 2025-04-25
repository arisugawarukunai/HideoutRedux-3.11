export type ModConfig = {
    verboseLogging: boolean;

    changeCraftConfigValues:boolean;
    craftConfig:CraftConfig;

    modifyScavCase:boolean;
    scavCaseChanges:ScavCaseChanges;

    changeConsumptionConfigValues:boolean;
    consumptionConfig:ConsumptionConfig;
    
    constructionTimeChanges:boolean;
    constructionConfig:ConstructionConfig;

    includeLocaleChanges:boolean;
    requirementChanges:boolean;
    bonusChanges:boolean;
    generatorFuelChangeOnly:boolean;
    productionChanges:boolean;

    useDefaultStashSizeBonus:boolean;
};

export type CraftConfig = {
    hoursForSkillCrafting:number;
    expCraftAmount:number;
}

export type ScavCaseChanges = {
    prodTime:boolean;
    requirements:boolean;
    rewards:boolean;
}

export type ConsumptionConfig = {
    generatorSpeedWithoutFuel:number;
    generatorFuelFlowRate:number;
    airFilterUnitFlowRate:number;
    gpuBoostRate:number;
}

export type ConstructionConfig = {
    constructionTimeModifier:number;
};
