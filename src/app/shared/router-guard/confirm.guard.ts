import { CanDeactivate } from '@angular/router';
import { CanConfirm } from './can-confirm.interface';

export class ConfirmGuard implements CanDeactivate<CanConfirm> {
  //第一个参数 范型类型的组件
  //根据当前要保护组件 的状态 判断当前用户是否能够离开
  canDeactivate(component: CanConfirm) {

    return window.confirm('你还没有保存，确定要离开吗？');
  }
}
