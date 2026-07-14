#!/bin/bash
/home/eru/.local/bin/php -d upload_max_filesize=25M -d post_max_size=27M -S 127.0.0.1:8000 -t public
