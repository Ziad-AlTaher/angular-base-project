import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { IS_SILENT_LOAD } from '../context/loading.context';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    // Skip the global spinner when the request opts out via HttpContext
    if (req.context.get(IS_SILENT_LOAD)) {
        return next(req);
    }

    const loadingService = inject(LoadingService);

    loadingService.show();

    return next(req).pipe(
        finalize(() => loadingService.hide())
    );
};
