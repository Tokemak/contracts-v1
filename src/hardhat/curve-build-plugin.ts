import {TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS} from "hardhat/builtin-tasks/task-names";
import {extendConfig, subtask} from "hardhat/config";
import {HardhatConfig} from "hardhat/types";
import "hardhat/types/config";
import path from "path";
import fs from "fs";

type CurveBuildConfig = {
    cwd: string;
    coins: number[];
    enable: boolean;
    preventClean: boolean;
    debug: boolean;
};

declare module "hardhat/types/config" {
    interface HardhatUserConfig {
        curveBuild?: Partial<CurveBuildConfig>;
    }

    interface HardhatConfig {
        curveBuild: CurveBuildConfig;
    }
}
const COINS_LINE_MATCH = /uint256\spublic\sconstant\sN_COINS\s=\s\d+;/;

const getDefaultConfig = (config: HardhatConfig): CurveBuildConfig => {
    return {
        cwd: config.paths.sources,
        coins: [2, 3, 4],
        enable: true,
        preventClean: false,
        debug: false,
    };
};

const log = (opts: CurveBuildConfig, msg: string) => {
    if (opts.debug) console.log(`Curve Build Plugin: ${msg}`);
};

extendConfig((config) => {
    const defaultConfig = getDefaultConfig(config);
    config.curveBuild = {...defaultConfig, ...config.curveBuild};
});

const curveControllerBuildTask = async (
    {opts}: {opts: CurveBuildConfig},
    contractNamePrefix: string,
    filenameMatch: RegExp,
    contractLineMatch: RegExp
) => {
    const controllerDir = path.join(opts.cwd, "controllers", "curve");

    // Delete the generated files
    if (!opts.preventClean) {
        log(opts, "Cleaning generated files");
        const files = fs.readdirSync(controllerDir);
        for (let i = 0; i < files.length; i++) {
            if (files[i].match(filenameMatch)) {
                log(opts, `Removing Curve Controller: ${files[i]}`);
                fs.rmSync(path.join(controllerDir, files[i]));
                log(opts, `Removed`);
            }
        }
    } else {
        log(opts, "Cleaning files is turned off");
    }

    if (!opts.enable) {
        log(opts, "Not Enabled");
        return;
    } else {
        log(opts, "Generation Enabled");
    }

    const template = fs.readFileSync(path.join(controllerDir, `${contractNamePrefix}Template.sol`)).toString();

    for (let i = 0; i < opts.coins.length; i++) {
        log(opts, `Generating files for coins: ${opts.coins[i]}`);
        let newFileContents = template.replace(COINS_LINE_MATCH, `uint256 public constant N_COINS = ${opts.coins[i]};`);
        newFileContents = newFileContents.replace(
            contractLineMatch,
            `contract ${contractNamePrefix}Pool${opts.coins[i]} is BaseController {`
        );
        fs.writeFileSync(path.join(controllerDir, `${contractNamePrefix}Pool${opts.coins[i]}.sol`), newFileContents);
        log(opts, `File Written`);
    }
};

subtask("hardhat-tokemak:curve-controller-build", async ({opts}: {opts: CurveBuildConfig}) => {
    const filenameMatch = /^CurveControllerPool\d+\.sol$/;
    const contractLineMatch = /^contract\sCurveControllerTemplate\sis\sBaseController\s\{/m;

    await curveControllerBuildTask({opts}, "CurveController", filenameMatch, contractLineMatch);
});

subtask("hardhat-tokemak:curve-controller-v2-build", async ({opts}: {opts: CurveBuildConfig}) => {
    const filenameMatch = /^CurveControllerV2Pool\d+\.sol$/;
    const contractLineMatch = /^contract\sCurveControllerV2Template\sis\sBaseController\s\{/m;

    await curveControllerBuildTask({opts}, "CurveControllerV2", filenameMatch, contractLineMatch);
});

subtask("hardhat-tokemak:curve-controller-meta-build", async ({opts}: {opts: CurveBuildConfig}) => {
    const filenameMatch = /^CurveControllerMetaPool\d+\.sol$/;
    const contractLineMatch = /^contract\sCurveControllerMetaTemplate\sis\sBaseController\s\{/m;

    opts.coins = [3, 4];

    await curveControllerBuildTask({opts}, "CurveControllerMeta", filenameMatch, contractLineMatch);
});

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS, async (_, {config, run}, runSuper) => {
    const opts = config.curveBuild;
    await run("hardhat-tokemak:curve-controller-build", {opts});
    await run("hardhat-tokemak:curve-controller-v2-build", {opts});
    await run("hardhat-tokemak:curve-controller-meta-build", {opts});
    return runSuper();
});
