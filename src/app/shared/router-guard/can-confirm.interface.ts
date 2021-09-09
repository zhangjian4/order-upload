import { RouterStateSnapshot } from '@angular/router';

export interface CanConfirm {
  deactivateConfirm(nextState: RouterStateSnapshot): Promise<boolean>;
}
