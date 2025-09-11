import { TimerHelper } from '../helpers/TimerHelper';
import { CashregistersTransactionsForParser, CashregisterTransactionParserInterface } from './CashregisterTransactionParserInterface';
import { DatabaseTypes } from 'repo-depkit-common';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';

export class ParseSchedule {
  private readonly context: WorkflowRunContext;
  private readonly parser: CashregisterTransactionParserInterface;

  constructor(context: WorkflowRunContext, parser: CashregisterTransactionParserInterface) {
    this.context = context;
    this.parser = parser;
  }

  async parse(): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    try {
      await this.context.logger.appendLog('Starting cashregister parsing');

      await this.context.logger.appendLog('Parsing cashregister transactions');
      let transactions = await this.parser.getTransactionsList();

      let totalTransactionsToCheck = transactions.length;
      let myTimer = new TimerHelper('Cash register' + ' parsing', totalTransactionsToCheck, 100);

      let external_cashregister_id_to_internal_cashregister_id: {
        [key: string]: string;
      } = {};

      // DEBUG: DELETE ALL TRANSACTIONS
      let clearAllData = false;
      if (clearAllData) {
        await this.context.myDatabaseHelper.getCashregisterHelper().deleteAllTransactions();
      }

      myTimer.start();

      for (let i = 0; i < totalTransactionsToCheck; i++) {
        //console.log("Transaction parsing progress: " + i + "/" + totalTransactionsToCheck);
        await this.context.logger.appendLog('Transaction parsing progress: ' + i + '/' + totalTransactionsToCheck);
        let transaction = transactions[i];
        if (!transaction) {
          continue;
        }

        let cashregister_external_id = transaction?.cashregister_external_idenfifier;
        //console.log("cashregister_external_id: "+cashregister_external_id);

        let cached_cashregister_id = external_cashregister_id_to_internal_cashregister_id[cashregister_external_id];
        let cashregister_id = undefined;
        //console.log("cached_cashregister_id: "+cached_cashregister_id);
        if (cached_cashregister_id === undefined) {
          //console.log("findOrCreateCashregister");
          let cashRegister = await this.context.myDatabaseHelper.getCashregisterHelper().findOrCreateCashregister(cashregister_external_id);
          if (!!cashRegister) {
            //console.log("cashRegister found: "+cashRegister.id);
            cached_cashregister_id = cashRegister?.id;
            external_cashregister_id_to_internal_cashregister_id[cashregister_external_id] = cached_cashregister_id;
            cashregister_id = cached_cashregister_id;
          }
        } else {
          cashregister_id = cached_cashregister_id;
        }
        //console.timeEnd("findOrCreateCashregister");

        if (cashregister_id !== undefined) {
          //console.log("cashregister_id found: "+cashregister_id);
          //console.log("findOrCreateCashregisterTransaction");
          await this.findOrCreateCashregisterTransaction(transaction, cashregister_id);
        } else {
          console.log('Houston we got a problem? Seems like somebody deleted a cashregister mid transaction');
        }

        myTimer.setCurrentCount(i);
        let timerInformation = myTimer.calcTimeSpent();
        let totalTimeInformation = timerInformation.totalTimeInformation;
        await this.context.logger.appendLog('Time spent: ' + totalTimeInformation);
      }

      await this.context.logger.appendLog('Finished');
      return this.context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.SUCCESS,
      });
    } catch (err: any) {
      await this.context.logger.appendLog('Error: ' + err.toString());
      return this.context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.FAILED,
      });
    }
  }

  async findOrCreateCashregisterTransaction(transaction: CashregistersTransactionsForParser, cashregister_id: string) {
    return await this.context.myDatabaseHelper.getCashregisterHelper().findOrCreateCashregisterTransaction(transaction, cashregister_id);
  }
}
