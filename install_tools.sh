if ! didc -V &> /dev/null
then
    unameOut="$(uname -s)"
    case "${unameOut}" in
        Linux*)     machine=Linux;;
        Darwin*)    machine=Mac;;
        *)          machine="UNKNOWN:${unameOut}"
    esac

    release=$(curl --silent "https://api.github.com/repos/dfinity/candid/releases/latest" | grep -e '"tag_name"' | cut -c 16-25)
    repl_release=0.3.10

    if [ ${machine} = "Mac" ]
    then
      echo "Downloading didc && ic-repl for Mac to ~/bin/didc"
      curl -fsSL --create-dirs https://github.com/dfinity/candid/releases/download/${release}/didc-macos > /usr/local/bin/didc
      curl -fsSL --create-dirs https://github.com/chenyan2002/ic-repl/releases/download/${repl_release}/ic-repl-macos > /usr/local/bin/ic-repl
      chmod +x /usr/local/bin/didc
      chmod +x /usr/local/bin/ic-repl

    elif [ ${machine} = "Linux" ]
    then
      echo "Downloading didc && ic-repl for Linux to $HOME/bin/didc"
      curl -fsSL https://github.com/dfinity/candid/releases/download/${release}/didc-linux64 > $HOME/bin/didc
      chmod +x $HOME/bin/didc
      curl -fsSL https://github.com/chenyan2002/ic-repl/releases/download/${repl_release}/ic-repl-linux64 > $HOME/bin/ic-repl
      chmod +x $HOME/bin/ic-repl
    else
      echo "Could not detect a supported operating system. Please note that didc && ic-repl is currently only supported for Mac and Linux"
    fi

    date
fi
