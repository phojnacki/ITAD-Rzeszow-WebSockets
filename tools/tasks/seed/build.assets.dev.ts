import * as gulp from 'gulp';
import { join } from 'path';

import { AssetsTask } from '../assets_task';
import Config from '../../config';

/**
 * Executes the build process, copying the assets located in `src/client` over to the appropriate
 * `dist/dev` directory.
 */
export =
  class BuildAssetsTask extends AssetsTask {
    run() {
      let paths: string[] = [
	join(Config.APP_CLIENT_SRC, '**'),
	'!' + join(Config.APP_CLIENT_SRC, '**', '*.ts'),
	'!' + join(Config.APP_CLIENT_SRC, '**', '*.scss'),
	'!' + join(Config.APP_CLIENT_SRC, '**', '*.sass')
	    ].concat(Config.TEMP_FILES.map((p) => { return '!' + p; }));

      return gulp.src(paths)
	.pipe(gulp.dest(Config.APP_CLIENT_DEST));
    }
  };

