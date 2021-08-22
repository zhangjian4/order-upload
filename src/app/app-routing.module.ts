import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/main',
    pathMatch: 'full'
  }, {
    path: 'main',
    loadChildren: () => import('./main/main.module').then(m => m.MainModule)
  }, {
    path: 'oauth2',
    loadChildren: () => import('./oauth/oauth.module').then(m => m.OauthModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
