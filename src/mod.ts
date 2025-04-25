import { container, DependencyContainer } from "tsyringe"

import construction from "../db/construction.json"
import locales from "../db/locales.json"
// import scavCase from "../db/scavcase.json"
// import production from "../db/production.json"
import modConfig from "../config/config.json";

import { ILogger } from "@spt/models/spt/utils/ILogger"
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor"
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod"
import { DatabaseServer } from "@spt/servers/DatabaseServer"
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables"
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod"
import { ConfigServer } from "@spt/servers/ConfigServer"
import { ConfigTypes } from "@spt/models/enums/ConfigTypes"
import { IHideoutConfig } from '@spt/models/spt/config/IHideoutConfig'
import { LocaleService } from '@spt/services/LocaleService'
// import { IHideoutProduction } from "@spt/models/eft/hideout/IHideoutProduction"


class Mod implements IPostDBLoadMod, IPostSptLoadMod
{
  private databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
  
  private modTitle = `Hideout Redux`
  private logger = container.resolve<ILogger>("WinstonLogger")
  private configServer = container.resolve<ConfigServer>("ConfigServer")
  private localeService = container.resolve<LocaleService>("LocaleService")
  
  public postDBLoad(container: DependencyContainer): void
  {
    const dbTables: IDatabaseTables = this.databaseServer.getTables()
    const sysLang = this.localeService.getDesiredGameLocale()
    
    // Apply changes to spt_data/server/hideout/settings
    if (modConfig.changeConsumptionConfigValues)
    {
      for (const value in modConfig.consumptionConfig)
      {
        for (const setting in dbTables.hideout.settings)
        {
          if (setting == value)
          {
            if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Current hideout database value for ${setting} is ${dbTables.hideout.settings[setting]}`,LogTextColor.GRAY)}
            dbTables.hideout.settings[setting] = modConfig.consumptionConfig[value]
            if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Adjusted to ${dbTables.hideout.settings[setting]}`,LogTextColor.CYAN)}
          }
        }
      }
    }// End settings changes
    
    // Set new construction requirements
    if (modConfig.requirementChanges)
    {
      construction.forEach(areaMod =>
      {
        dbTables.hideout.areas.forEach(area =>
        {
          if (area._id == areaMod._id)
          {
            for (const stage in area.stages)
            {
              if (stage != "0")
              {
                area.stages[stage].requirements = areaMod.stages[stage].requirements
                if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Updated ${areaMod.area} level ${stage} to include ${area.stages[stage].requirements.length} total requirements.`,LogTextColor.CYAN)}
              }
            }
          }
        })
      })
      if(!modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Set new hideout level requirements`,LogTextColor.CYAN)}
    }// End construction requirement changes
    
    // Set new hideout bonuses
    if (modConfig.bonusChanges)
    {
      if (modConfig.useDefaultStashSizeBonus)
      {
        construction.forEach(areaMod =>
        {
          dbTables.hideout.areas.forEach(area =>
          {
            if (area.type != 3)
            {
              if (area._id == areaMod._id)
              {
                for (const stage in area.stages)
                {
                  if (stage != "0")
                  {
                    area.stages[stage].bonuses = areaMod.stages[stage].bonuses
                    if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Updated ${areaMod.area} level ${stage} to include ${area.stages[stage].bonuses.length} total bonuses.`,LogTextColor.CYAN)}
                  }
                }
              }
            }
          })
        })
      }
      else
      {
        construction.forEach(areaMod =>
        {
          dbTables.hideout.areas.forEach(area =>
          {
            if (area._id == areaMod._id)
            {
              for (const stage in area.stages)
              {
                if (stage != "0")
                {
                  area.stages[stage].bonuses = areaMod.stages[stage].bonuses
                  if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Updated ${areaMod.area} level ${stage} to include ${area.stages[stage].bonuses.length} total bonuses.`,LogTextColor.CYAN)}
                }
              }
            }
          })
        })
      }
      if(!modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Set new hideout level bonuses`,LogTextColor.CYAN)}
    }// End hideout bonus changes
    
    // Set new hideout construction times
    if (modConfig.constructionTimeChanges)
    {
      construction.forEach(areaMod =>
      {
        dbTables.hideout.areas.forEach(area =>
        {
          if (area._id == areaMod._id)
          {
            for (const stage in area.stages)
            {
              if (stage != "0")
              {
                area.stages[stage].constructionTime = Math.round(areaMod.stages[stage].constructionTime * modConfig.constructionConfig.constructionTimeModifier)
                
                if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Updated ${areaMod.area} level ${stage} construction time to ${area.stages[stage].constructionTime}.`,LogTextColor.CYAN)}
              }
            }
          }
        })
      })
      if(!modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Set new hideout construction times`,LogTextColor.CYAN)}
    }// End construction time changes
    
    /*
    /// QUARANTINE: Backend changes seem to have put scav case and production RECIPES on the {dbTables.hideout.production.recipes} and {dbTables.hideout.production.scavRecipes}.
    ///   What will I do with that information? I do not know, we will find out later.
    ///   For now, this is quarantined: should not be deleted, and is due for later review, but isn't impeditive to 1.1.3 update of the mod.
    /// 
    
    // Update scav case payments and rewards
    if (modConfig.modifyScavCase)
    {
      scavCase.forEach(newPayment =>
      {
        dbTables.hideout.scavcase.forEach(payment =>
        {
          if (payment._id == newPayment._id)
          {
            // Update requirements
            if (modConfig.scavCaseChanges.requirements)
            {
              payment.Requirements = newPayment.Requirements
              if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Changed Scav Case payment to ${payment.Requirements[0].templateId}`,LogTextColor.CYAN)}
            }
            // Update production time
            if (modConfig.scavCaseChanges.prodTime)
            {
              payment.ProductionTime = newPayment.ProductionTime
              if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Production time changed for Scav Case payment ${payment.Requirements[0].templateId}`,LogTextColor.CYAN)}
            }
            // Update end products
            if (modConfig.scavCaseChanges.rewards)
            {
              payment.EndProducts = newPayment.EndProducts
              if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Reward changed for Scav Case payment ${payment.Requirements[0].templateId}`,LogTextColor.CYAN)}
            }
          }
        })
      })
      if(!modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Updated Scav Case hideout area`,LogTextColor.CYAN)}
    }//End scav case changes
    */

    // Update locales to reflect "new" hideout
    if (modConfig.includeLocaleChanges)
    {
      for (const locale in locales)
      {
        dbTables.locales.global[sysLang][locale] = locales[locale]
        if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Modified hideout locale: ${locale}`,LogTextColor.CYAN)}
      }
      if(!modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Updated hideout locales`,LogTextColor.CYAN)}
    }// End locale changes
    
    // Modify ONLY fuel filters for Generator stage 1 and stage 2
    if (modConfig.generatorFuelChangeOnly)
    {
      dbTables.hideout.areas.forEach(area =>
      {
        if (area.type == 4)
        {
          area.stages[1].bonuses.forEach(bonus =>
          {
            if (bonus.type == "AdditionalSlots")
            {
              bonus.filter = ["5d1b371186f774253763a656"]
              this.logger.logWithColor(`${this.modTitle}: Set Generator stage 1 fuel to kerosene ONLY`,LogTextColor.CYAN)
            }
          })
          area.stages[2].bonuses.forEach(bonus =>
            {
              if (bonus.type == "AdditionalSlots")
              {
                bonus.filter = ["5d1b36a186f7742523398433"]
                this.logger.logWithColor(`${this.modTitle}: Set Generator stage 2 fuel to gasoline ONLY`,LogTextColor.CYAN)
              }
            })
        }
      })
    }// End fuel changes
    
    /*
    /// QUARANTINE: Backend changes seem to have put scav case and production RECIPES on the {dbTables.hideout.production.recipes} and {dbTables.hideout.production.scavRecipes}.
    ///   What will I do with that information? I do not know, we will find out later.
    ///   For now, this is quarantined: should not be deleted, and is due for later review, but isn't impeditive to 1.1.3 update of the mod.
    /// 
    
    // Import our new productions from productions.json
    if (modConfig.productionChanges) {
      // Doing this so that TS will yell at us if the json is wack
      const productionData: IHideoutProduction[] = production;
      dbTables.hideout.production.push(...productionData);
    }// End production importing
    */
  }
  public postSptLoad(container: DependencyContainer): void
  {
    // Apply changes to spt_data/server/configs/hideout
    if (modConfig.changeConsumptionConfigValues)
    {
      const hideoutConfig: IHideoutConfig = this.configServer.getConfig<IHideoutConfig>(ConfigTypes.HIDEOUT)
      for (const value in modConfig.consumptionConfig)
      {
        for (const config in hideoutConfig)
        {
          if (config == value)
          {
            if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}:Current hideout config value for  ${config} is ${hideoutConfig[config]}`,LogTextColor.GRAY)}
            hideoutConfig[config] = modConfig.consumptionConfig[value]
            if(modConfig.verboseLogging){this.logger.logWithColor(`${this.modTitle}: Adjusted to ${hideoutConfig[config]}`,LogTextColor.CYAN)}
          }
        }
      }
      if(!modConfig.verboseLogging){this.logger.logWithColor(`Hideout changes applied`,LogTextColor.CYAN)}
    }
  }
}
export const mod = new Mod();