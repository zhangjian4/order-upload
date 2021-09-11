import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/main',
    pathMatch: 'full',
  },
  {
    path: 'main',
    loadChildren: () => import('./main/main.module').then((m) => m.MainModule),
  },
  {
    path: 'oauth',
    loadChildren: () =>
      import('./oauth/oauth.module').then((m) => m.OauthModule),
  },
  {
    path: 'camera',
    loadChildren: () =>
      import('./camera/camera.module').then((m) => m.CameraModule),
  },
  {
    path: 'detail',
    loadChildren: () =>
      import('./detail/detail.module').then((m) => m.DetailModule),
  },
  {
    path: 'preupload',
    loadChildren: () =>
      import('./preupload/preupload.module').then((m) => m.PreuploadModule),
  },
  {
    path: 'opencv-test',
    loadChildren: () =>
      import('./opencv-test/opencv-test.module').then((m) => m.OpencvTestModule),
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
