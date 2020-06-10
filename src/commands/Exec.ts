import Debug from 'debug';
import { Command } from  '@chimpwizards/wand'
import { Config } from '@chimpwizards/wand'
import { Execute } from '@chimpwizards/wand'
import { CommandDefinition, CommandParameter, CommandArgument } from '@chimpwizards/wand/commons/command/index'
const chalk = require('chalk');
const debug = Debug("w:cli:exec");

@CommandDefinition({ 
    description: 'Execute a command across all packages/components',
    alias: 'x',
    examples: [
        [`exec 'git commit -am "Update changes"'`, `Execute "git commit.." command in all packages folders`],
        [`exec --- git commit -am "Update changes"`, `Execute "git commit.." command in all packages folders`],
        [`exec --no-root 'ls -la'`, `Execute "ls -la" command except on the root folder`],
        [`exec --filter hello-world pwd`, `execute the "pwd" command on the packages's name matching "hello-world"`],
    ]
})
export class Exec extends Command  { 

    @CommandArgument({ description: 'Command to execute', name: 'exec-command'})
    @CommandParameter({ description: 'Command to execute', alias: 'c'})
    command: string = '';

    @CommandParameter({ description: 'Include root folder', defaults: true})
    root: boolean = true;

    @CommandParameter({ description: 'Filter Package/Component name ising this filter/search criteria where the command will be executed'})
    filter: string = "*";


    execute(yargs: any): void {
        debug(`Exec ${this.command}`)
        debug(`THIS ${JSON.stringify(this)}`)
        debug(`YARGS ${JSON.stringify(yargs)}`)

        const args = process.argv.slice(3);
        debug(`ARGS ${JSON.stringify(args)}`)
        
        const config = new Config();
        const context = config.load()

        debug(`CONFIG ${JSON.stringify(context)}`)

        const executer = new Execute();

        
        let cmd = this.command;

        if (args.join(" ").indexOf("---")>=0) {
            cmd = args.join(" ").substring(args.join(" ").indexOf("---")+4).replace("::","|")
        }

        executer.run({ cmd: cmd})

        console.log(`Exec ${chalk.green(this.command)} !!!`)
    }

}

export function register ():any {
    debug(`Registering....`)
    let command = new Exec();
    debug(`INIT: ${JSON.stringify(Object.getOwnPropertyNames(command))}`)

    return command.build()
}

