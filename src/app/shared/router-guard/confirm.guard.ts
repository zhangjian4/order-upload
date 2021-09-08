import { CanDeactivate } from '@angular/router';

export class ConfirmGuard implements CanDeactivate<any> {
  //第一个参数 范型类型的组件
  //根据当前要保护组件 的状态 判断当前用户是否能够离开
  canDeactivate(component: any) {
    return window.confirm('你还没有保存，确定要离开吗？');
  }
}
