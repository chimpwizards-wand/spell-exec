import Debug from 'debug';
import { Command } from  '@chimpwizards/wand'
import { Config } from '@chimpwizards/wand'
import { Execute } from '@chimpwizards/wand'
import { CommandDefinition, CommandParameter, CommandArgument } from '@chimpwizards/wand/commons/command/index'
import * as _ from 'lodash';  

const chalk = require('chalk');
const debug = Debug("w:cli:shell");

@CommandDefinition({ 
    description: 'Execute a command across all packages/components',
    alias: 'x',
    examples: [
        [`shell 'git commit -am "Update changes"'`, `Execute "git commit.." command in all packages folders`],
        [`shell --- git commit -am "Update changes"`, `Execute "git commit.." command in all packages folders`],
        [`shell --no-root 'ls -la'`, `Execute "ls -la" command except on the root folder`],
        [`shell --filter hello-world pwd`, `execute the "pwd" command on the packages's name matching "hello-world"`],
    ]
})
export class Shell extends Command  { 

    @CommandArgument({ description: 'Command to execute', name: 'shell-command'})
    @CommandParameter({ description: 'Command to execute', alias: 'c'})
    command: string = '';

    @CommandParameter({ description: 'Include root folder', defaults: true})
    root: boolean = true;

    @CommandParameter({ description: 'Include dependencies folders', defaults: true})
    dependencies: boolean = true;

    @CommandParameter({ description: 'Filter Package/Component name ising this filter/search criteria where the command will be executed', defaults: '*'})
    filter: string = "*";


    execute(yargs: any): void {
        debug(`Exec ${this.command}`)
        debug(`THIS ${JSON.stringify(this)}`)
        debug(`YARGS ${JSON.stringify(yargs)}`)

        const args = process.argv.slice(3);
        debug(`ARGS ${JSON.stringify(args)}`)
       

        const executer = new Execute();
        
        let cmd = this.command;

        if (args.join(" ").indexOf("---")>=0) {
            cmd = args.join(" ").substring(args.join(" ").indexOf("---")+4)
                .replace("::","|")
                .replace("!!","|")
        }

        //Execute on Root
        if (this.root) {
            debug(`Execute command on root`)
            executer.run({cmd: cmd})
        }
        // _.each(config.components||[], (component, name) => {
        //Execut for each package
        if (this.dependencies) {
            debug(`Execute command on dependencies`)
            const config = new Config();
            const context = config.load()
            let self = this;
            debug(`CONFIG ${JSON.stringify(context)}`)
            if(context) {
                _.each(context.dependencies||[], (pack, name) => {
                    let doit: boolean = true;
                    if (self.filter != "*") {
                        debug(`FIND packages that incldues ${self.filter}`)
                        var matcher = new RegExp(self.filter ,"gi");
                        if (matcher.test(name)) {
                            doit = true;
                        }
                    }
                    if (doit) {
                        debug(`EXECUTING (${name}): ${cmd}`)
                        executer.run({folder:pack.path, cmd: cmd})
                    }
                });
            }
        }
    }

}

export function register ():any {
    debug(`Registering....`)
    let command = new Shell();
    debug(`INIT: ${JSON.stringify(Object.getOwnPropertyNames(command))}`)

    return command.build()
}

