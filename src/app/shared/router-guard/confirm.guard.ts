import {
  ActivatedRouteSnapshot,
  CanDeactivate,
  RouterStateSnapshot,
} from '@angular/router';
import { CanConfirm } from './can-confirm.interface';

export class ConfirmGuard implements CanDeactivate<CanConfirm> {
  //第一个参数 范型类型的组件
  //根据当前要保护组件 的状态 判断当前用户是否能够离开
  canDeactivate(
    component: CanConfirm,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ) {
    return component.deactivateConfirm(nextState);
    // return window.confirm('你还没有保存，确定要离开吗？');
  }
}
